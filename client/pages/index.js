import React, { useState, useEffect, useRef } from 'react'
import Head from 'next/head'

// 导航菜单数据
const navMenu = [
  { id: 'tasks', name: '任务', icon: '📋' },
  { id: 'tools', name: '工具', icon: '🔧' },
  { id: 'reports', name: '报告', icon: '📊' },
  { id: 'settings', name: '设置', icon: '⚙️' },
]

// 模拟任务数据
const mockTasks = [
  { id: 1, target: '192.168.1.1', status: '进行中', startTime: '2026-02-05 09:00' },
  { id: 2, target: 'example.com', status: '已完成', startTime: '2026-02-05 08:30' },
  { id: 3, target: '10.0.0.1', status: '等待中', startTime: '2026-02-05 09:30' },
]

// 状态颜色映射
const statusColors = {
  '进行中': 'bg-yellow-500',
  '已完成': 'bg-green-500',
  '等待中': 'bg-gray-500',
}

export default function Home() {
  const [activeNav, setActiveNav] = useState('tasks')
  const [scanTarget, setScanTarget] = useState('')
  const [logs, setLogs] = useState([])
  const [isScanning, setIsScanning] = useState(false)
  const [aiGuidance, setAiGuidance] = useState('欢迎使用 KaliNexus AI 渗透测试平台！我将为您提供渗透测试的建议和步骤解释。')
  const wsRef = useRef(null)
  const logsEndRef = useRef(null)

  // 滚动到日志底部
  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(scrollToBottom, [logs])

  // 初始化WebSocket连接
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/ws/logs')
    wsRef.current = ws

    ws.onopen = () => {
      console.log('WebSocket连接已建立')
    }

    ws.onmessage = (event) => {
      setLogs(prev => [...prev, event.data])
    }

    ws.onclose = () => {
      console.log('WebSocket连接已关闭')
    }

    return () => {
      ws.close()
    }
  }, [])

  // 处理扫描提交
  const handleScanSubmit = async (e) => {
    e.preventDefault()
    if (!scanTarget) return

    setIsScanning(true)
    setLogs([])

    try {
      const response = await fetch('http://localhost:8000/scan/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ target: scanTarget }),
      })

      if (!response.ok) {
        throw new Error('扫描启动失败')
      }

      const data = await response.json()
      console.log('扫描任务已启动:', data)
    } catch (error) {
      console.error('错误:', error)
      setLogs(prev => [...prev, `错误: ${error.message}`])
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 text-white">
      <Head>
        <title>KaliNexus AI 渗透测试平台</title>
        <meta name="description" content="基于AI的渗透测试平台" />
      </Head>

      <div className="flex h-screen overflow-hidden">
        {/* 左侧边栏 */}
        <div className="w-64 bg-dark-800 border-r border-dark-700 p-4">
          <div className="flex items-center justify-center h-16 mb-8">
            <h1 className="text-2xl font-bold text-primary-400">KaliNexus AI</h1>
          </div>
          
          <nav className="space-y-2">
            {navMenu.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveNav(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeNav === item.id ? 'bg-primary-600 text-white' : 'hover:bg-dark-700'}`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* 中间主区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">实时任务看板</h2>
            
            {/* 扫描表单 */}
            <form onSubmit={handleScanSubmit} className="mb-6">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={scanTarget}
                  onChange={(e) => setScanTarget(e.target.value)}
                  placeholder="输入目标URL或IP地址"
                  className="flex-1 px-4 py-2 bg-dark-800 border border-dark-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={isScanning}
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
                  disabled={isScanning || !scanTarget}
                >
                  {isScanning ? '扫描中...' : '开始扫描'}
                </button>
              </div>
            </form>

            {/* 任务列表 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {mockTasks.map((task) => (
                <div key={task.id} className="bg-dark-800 border border-dark-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{task.target}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${statusColors[task.status]}`}>
                      {task.status}
                    </span>
                  </div>
                  <p className="text-sm text-dark-500">开始时间: {task.startTime}</p>
                </div>
              ))}
            </div>

            {/* 日志输出 */}
            <div className="bg-dark-800 border border-dark-700 rounded-lg p-4">
              <h3 className="font-semibold mb-3">终端输出</h3>
              <div className="h-80 overflow-y-auto bg-dark-900 p-4 rounded-lg font-mono text-sm">
                {logs.length === 0 ? (
                  <p className="text-dark-500">等待扫描开始...</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="mb-1">{log}</div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>
        </div>

        {/* 右侧侧边栏 - AI领航员 */}
        <div className="w-80 bg-dark-800 border-l border-dark-700 p-4">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <span className="text-xl mr-2">🤖</span>
              AI 领航员
            </h3>
            
            {/* AI 气泡对话框 */}
            <div className="bg-dark-900 border border-dark-700 rounded-lg p-4 mb-4">
              <div className="flex space-x-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
                  🤖
                </div>
                <div className="flex-1 bg-dark-800 rounded-lg p-3">
                  <p className="text-sm">
                    欢迎使用 KaliNexus AI 渗透测试平台！我将为您提供渗透测试的建议和步骤解释。
                  </p>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <div className="flex-1 bg-dark-700 rounded-lg p-3 order-2">
                  <p className="text-sm">
                    我需要扫描一个目标网站，应该使用什么工具？
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center order-1">
                  👤
                </div>
              </div>
            </div>

            {/* AI 建议 */}
            <div className="bg-dark-900 border border-dark-700 rounded-lg p-4">
              <h4 className="font-medium mb-2">建议步骤</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="text-primary-400 mr-2">1.</span>
                  <span>使用 Nmap 进行端口扫描，发现开放的服务</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-400 mr-2">2.</span>
                  <span>针对开放的服务进行漏洞扫描</span>
                </li>
                <li className="flex items-start">
                  <span className="text-primary-400 mr-2">3.</span>
                  <span>分析扫描结果，生成渗透测试报告</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
