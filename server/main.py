from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.websockets import WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import asyncio
import os

from config import config

# 创建FastAPI实例
app = FastAPI(
    title="KaliNexus AI 渗透测试平台",
    description="基于FastAPI的渗透测试平台后端API",
    version="1.0.0"
)

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket连接管理
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    
    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except:
                self.disconnect(connection)

manager = ConnectionManager()

# 数据模型
class ScanRequest(BaseModel):
    target: str

class HealthCheckResponse(BaseModel):
    status: str
    tools: dict

# 健康检查端点
@app.get("/health", response_model=HealthCheckResponse)
def health_check():
    """健康检查，返回工具可用性状态"""
    tool_statuses = {}
    for tool, status in config.TOOL_STATUS.items():
        tool_statuses[tool] = status.value
    
    return HealthCheckResponse(
        status="healthy",
        tools=tool_statuses
    )

# 扫描启动端点
@app.post("/scan/start")
async def start_scan(scan_request: ScanRequest):
    """启动Nmap扫描任务"""
    target = scan_request.target
    
    # 检查工具可用性
    if not config.is_tool_available("nmap"):
        raise HTTPException(status_code=400, detail="Nmap工具不可用")
    
    # 异步执行扫描任务
    async def run_scan():
        # 模拟扫描过程
        await manager.broadcast(f"开始扫描目标: {target}")
        await asyncio.sleep(1)
        
        if config.IS_WINDOWS and config.NMAP_STATUS.value == "模拟模式":
            # 模拟模式输出
            mock_output = [
                "Starting Nmap 7.94 ( https://nmap.org ) at 2026-02-05",
                f"Nmap scan report for {target}",
                "Host is up (0.0010s latency).",
                "",
                "PORT   STATE SERVICE",
                "80/tcp  open  http",
                "443/tcp open  https",
                "",
                "Nmap done: 1 IP address (1 host up) scanned in 0.10 seconds"
            ]
            for line in mock_output:
                await manager.broadcast(line)
                await asyncio.sleep(0.5)
        else:
            # 实际执行Nmap扫描
            import subprocess
            process = subprocess.Popen(
                [config.NMAP_PATH, "-sV", target],
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                text=True
            )
            
            for line in process.stdout:
                await manager.broadcast(line.strip())
                await asyncio.sleep(0.1)
    
    # 启动后台任务
    asyncio.create_task(run_scan())
    
    return {"message": "扫描任务已启动", "target": target}

# WebSocket端点
@app.websocket("/ws/logs")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket端点，用于实时推送日志"""
    await manager.connect(websocket)
    try:
        while True:
            # 保持连接
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=config.API_HOST,
        port=config.API_PORT,
        reload=True
    )
