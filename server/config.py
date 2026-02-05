import os
from enum import Enum
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()


class ToolStatus(Enum):
    """工具状态枚举"""
    AVAILABLE = "可用"
    UNAVAILABLE = "不可用"
    MOCK = "模拟模式"


class Config:
    """配置类"""
    # 操作系统检测
    OS_TYPE = os.name
    IS_WINDOWS = OS_TYPE == "nt"
    IS_LINUX = OS_TYPE == "posix"
    
    # 数据库配置
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/pentest.db")
    
    # API配置
    API_HOST = os.getenv("API_HOST", "0.0.0.0")
    API_PORT = int(os.getenv("API_PORT", "8000"))
    
    # 前端配置
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # 工具路径配置
    if IS_WINDOWS:
        # Windows环境
        NMAP_PATH = os.getenv("WINDOWS_NMAP_PATH", "mock")
        NMAP_STATUS = ToolStatus.MOCK if NMAP_PATH == "mock" else ToolStatus.AVAILABLE
    else:
        # Linux环境
        NMAP_PATH = os.getenv("KALI_NMAP_PATH", "/usr/bin/nmap")
        NMAP_STATUS = ToolStatus.AVAILABLE if os.path.exists(NMAP_PATH) else ToolStatus.UNAVAILABLE
    
    # 工具状态字典
    TOOL_STATUS = {
        "nmap": NMAP_STATUS
    }
    
    @classmethod
    def get_tool_status(cls, tool_name: str) -> ToolStatus:
        """获取工具状态"""
        return cls.TOOL_STATUS.get(tool_name, ToolStatus.UNAVAILABLE)
    
    @classmethod
    def is_tool_available(cls, tool_name: str) -> bool:
        """检查工具是否可用"""
        status = cls.get_tool_status(tool_name)
        return status in [ToolStatus.AVAILABLE, ToolStatus.MOCK]


# 创建配置实例
config = Config()
