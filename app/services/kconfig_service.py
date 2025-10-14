import os
import tempfile
from pathlib import Path
from typing import Dict, List, Optional, Any
import kconfiglib
from flask import current_app

# 继续 app/services/kconfig_service.py

class KconfigService:
    def __init__(self, workspace_path: Path):
        self.workspace_path = workspace_path
        self.kconfig_path = workspace_path / "Kconfig"
        self._kconfig: Optional[kconfiglib.Kconfig] = None
        self._symbol_cache: Dict[str, Any] = {}
    
    def load_kconfig(self) -> kconfiglib.Kconfig:
        """加载Kconfig"""
        if self._kconfig is None:
            if not self.kconfig_path.exists():
                raise FileNotFoundError(f"Kconfig not found at {self.kconfig_path}")
            
            try:
                self._kconfig = kconfiglib.Kconfig(str(self.kconfig_path))
                current_app.logger.info(f"Kconfig loaded from {self.kconfig_path}")
            except Exception as e:
                current_app.logger.error(f"Failed to load Kconfig: {e}")
                raise Exception(f"Kconfig loading failed: {str(e)}")
        
        return self._kconfig
    
    def reload_kconfig(self) -> kconfiglib.Kconfig:
        """重新加载Kconfig（用于添加feeds后）"""
        self._kconfig = None
        self._symbol_cache.clear()
        return self.load_kconfig()
    
    def get_menu_tree(self) -> Dict[str, Any]:
        """获取配置菜单树"""
        kconf = self.load_kconfig()
        return self._serialize_menu_node(kconf.top_node)
    
    def _serialize_menu_node(self, node) -> Optional[Dict[str, Any]]:
        """递归序列化菜单节点"""
        if not node.item or not (isinstance(node.item, kconfiglib.Choice) or node.prompt):
            return None

        item_type = "unknown"
        if isinstance(node.item, kconfiglib.Symbol):
            item_type = "symbol"
        elif isinstance(node.item, kconfiglib.Choice):
            item_type = "choice"
        elif isinstance(node.item, kconfiglib.Comment):
            item_type = "comment"

        data = {
            "type": item_type,
            "name": node.item.name if hasattr(node.item, 'name') else None,
            "prompt": node.prompt[0] if node.prompt else None,
            "help": node.help,
            "visible": node.visibility > 0,
            "path": self._get_node_path(node)
        }

        if isinstance(node.item, (kconfiglib.Symbol, kconfiglib.Choice)):
            data.update({
                "value": node.item.str_value,
                "data_type": kconfiglib.TYPE_TO_STR[node.item.type],
                "assignable": [str(val) for val in node.item.assignable] if hasattr(node.item, 'assignable') else []
            })
            
            # 添加选择项信息
            if isinstance(node.item, kconfiglib.Choice):
                data["choices"] = [
                    {
                        "name": sym.name,
                        "prompt": sym.nodes[0].prompt[0] if sym.nodes and sym.nodes[0].prompt else sym.name,
                        "selected": sym.choice and sym.choice.selection == sym
                    }
                    for sym in node.item.syms
                ]

        # 处理子节点
        children = []
        if node.list:
            for child in node.list:
                serialized_child = self._serialize_menu_node(child)
                if serialized_child is not None:
                    children.append(serialized_child)
        
        data["children"] = children
        return data
    
    def _get_node_path(self, node) -> str:
        """构建节点路径"""
        path = []
        curr = node
        while curr and curr.prompt:
            path.insert(0, curr.prompt[0])
            curr = curr.parent
        return " > ".join(path)
    
    def update_symbol(self, symbol_name: str, new_value: str) -> Dict[str, Any]:
        """更新符号值并返回变更"""
        kconf = self.load_kconfig()
        
        if symbol_name not in kconf.syms:
            raise ValueError(f"Symbol '{symbol_name}' not found")

        sym = kconf.syms[symbol_name]
        
        # 记录变更前的状态
        old_states = {
            s.name: (s.str_value, s.visibility) 
            for s in kconf.syms.values()
        }
        
        try:
            # 验证值的有效性
            if sym.type in (kconfiglib.BOOL, kconfiglib.TRISTATE):
                if new_value not in ['y', 'n', 'm']:
                    raise ValueError(f"Invalid value '{new_value}' for boolean/tristate symbol")
            elif sym.type == kconfiglib.INT:
                try:
                    int(new_value)
                except ValueError:
                    raise ValueError(f"Invalid integer value: {new_value}")
            elif sym.type == kconfiglib.HEX:
                try:
                    int(new_value, 16)
                except ValueError:
                    raise ValueError(f"Invalid hex value: {new_value}")
            
            # 设置新值
            sym.set_value(new_value)
            
        except ValueError as e:
            current_app.logger.error(f"Symbol update error: {e}")
            raise
        
        # 检测变更
        changes = []
        for s in kconf.syms.values():
            old_val, old_vis = old_states.get(s.name, (None, None))
            new_vis = s.visibility
            
            if old_val != s.str_value or old_vis != new_vis:
                changes.append({
                    "name": s.name,
                    "old_value": old_val,
                    "new_value": s.str_value,
                    "visible": new_vis > 0,
                    "prompt": s.nodes[0].prompt[0] if s.nodes and s.nodes[0].prompt else s.name
                })
        
        # 更新缓存
        self._symbol_cache[symbol_name] = s.str_value
        
        return {"changes": changes}
    
    def search_symbols(self, query: str, max_results: int = 100) -> List[Dict[str, Any]]:
        """搜索符号"""
        if not query or len(query) < 2:
            return []
        
        kconf = self.load_kconfig()
        results = []
        query_lower = query.lower()
        
        for sym in kconf.syms.values():
            if len(results) >= max_results:
                break
            
            # 搜索匹配条件
            name_match = query_lower in sym.name.lower()
            prompt_match = False
            help_match = False
            
            if sym.nodes:
                node = sym.nodes[0]
                if node.prompt:
                    prompt_match = query_lower in node.prompt[0].lower()
                if node.help:
                    help_match = query_lower in node.help.lower()
            
            if name_match or prompt_match or help_match:
                node = sym.nodes[0] if sym.nodes else None
                results.append({
                    "name": sym.name,
                    "prompt": node.prompt[0] if node and node.prompt else sym.name,
                    "path": self._get_node_path(node) if node else "N/A",
                    "visible": node.visibility > 0 if node else False,
                    "value": sym.str_value,
                    "type": kconfiglib.TYPE_TO_STR[sym.type],
                    "match_type": "name" if name_match else ("prompt" if prompt_match else "help")
                })
        
        return results
    
    def load_config_file(self, config_content: str) -> Dict[str, Any]:
        """从配置内容加载配置"""
        kconf = self.load_kconfig()
        
        try:
            # 创建临时文件
            with tempfile.NamedTemporaryFile(mode='w', suffix='.config', delete=False) as f:
                f.write(config_content)
                temp_path = f.name
            
            try:
                # 加载配置
                kconf.load_config(temp_path)
                current_app.logger.info("Configuration loaded successfully")
                
                # 返回更新后的树
                return self.get_menu_tree()
                
            finally:
                # 清理临时文件
                os.unlink(temp_path)
                
        except Exception as e:
            current_app.logger.error(f"Failed to load config: {e}")
            raise Exception(f"Configuration loading failed: {str(e)}")
    
    def save_config(self, config_type: str = "full") -> str:
        """保存配置到字符串"""
        kconf = self.load_kconfig()
        
        try:
            if config_type == "minimal":
                # 保存最小配置
                with tempfile.NamedTemporaryFile(mode='w', suffix='.config', delete=False) as f:
                    temp_path = f.name
                
                try:
                    kconf.write_min_config(temp_path)
                    with open(temp_path, 'r') as f:
                        return f.read()
                finally:
                    os.unlink(temp_path)
            else:
                # 保存完整配置
                with tempfile.NamedTemporaryFile(mode='w', suffix='.config', delete=False) as f:
                    temp_path = f.name
                
                try:
                    kconf.write_config(temp_path)
                    with open(temp_path, 'r') as f:
                        return f.read()
                finally:
                    os.unlink(temp_path)
                    
        except Exception as e:
            current_app.logger.error(f"Failed to save config: {e}")
            raise Exception(f"Configuration saving failed: {str(e)}")
    
    def compare_configs(self, other_config_content: str) -> List[Dict[str, Any]]:
        """比较配置"""
        kconf_a = self.load_kconfig()
        
        # 创建第二个Kconfig实例用于比较
        kconf_b = kconfiglib.Kconfig(str(self.kconfig_path))
        
        try:
            # 加载要比较的配置
            with tempfile.NamedTemporaryFile(mode='w', suffix='.config', delete=False) as f:
                f.write(other_config_content)
                temp_path = f.name
            
            try:
                kconf_b.load_config(temp_path)
            finally:
                os.unlink(temp_path)
            
            # 比较配置
            diff = []
            all_sym_names = set(kconf_a.syms.keys()) | set(kconf_b.syms.keys())
            
            for name in sorted(all_sym_names):
                sym_a = kconf_a.syms.get(name)
                sym_b = kconf_b.syms.get(name)
                
                val_a = sym_a.str_value if sym_a else "N/A"
                val_b = sym_b.str_value if sym_b else "N/A"
                
                if val_a != val_b:
                    # 获取符号信息
                    sym = sym_a or sym_b
                    prompt = name
                    if sym and sym.nodes and sym.nodes[0].prompt:
                        prompt = sym.nodes[0].prompt[0]
                    
                    diff.append({
                        "name": name,
                        "prompt": prompt,
                        "current_value": val_a,
                        "other_value": val_b,
                        "type": kconfiglib.TYPE_TO_STR[sym.type] if sym else "unknown"
                    })
            
            return diff
            
        except Exception as e:
            current_app.logger.error(f"Config comparison failed: {e}")
            raise Exception(f"Configuration comparison failed: {str(e)}")
