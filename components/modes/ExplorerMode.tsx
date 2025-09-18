'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, Send, Sparkles } from 'lucide-react'


interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: string
  region?: string
  learning_score?: number
  insights_used?: number
  ai_enhanced?: boolean
  typo_corrections?: Array<{original: string, corrected: string, position: number}>
  original_query?: string
  corrected_query?: string
  detected_intents?: Record<string, number>
  suggestions?: string[]
  response_style?: string
  conversational_insights?: any[]
  educational_context?: any
  interactive_elements?: any[]
}

// Enhanced custom styles for markdown and scrollbar with gradient theme
const customStyles = `
  @keyframes gradient-x {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }
  
  @keyframes gradient-move {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }
  
  .animate-gradient-x {
    animation: gradient-x 3s ease infinite;
  }
  
  .animate-gradient-move {
    animation: gradient-move 8s ease infinite;
  }
  
  .glass-input-container {
    position: relative;
    border-radius: 1rem;
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(20px);
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
  }
  
  .glass-input-container:focus-within {
    background: rgba(0, 0, 0, 0.4);
    box-shadow: 
      0 8px 32px rgba(0, 0, 0, 0.4),
      0 0 0 1px rgba(255, 255, 255, 0.2),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.2);
  }
  
  .glass-input {
    background: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(10px);
    border: none;
    color: white;
  }
  
  .glass-input::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }
  
  .markdown-content {
    line-height: 1.7;
  }
  
  .markdown-content h3 {
    background: linear-gradient(135deg, #ff5f6d 0%, #ffc371 20%, #47cf73 40%, #00c6ff 60%, #845ec2 80%, #d65db1 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 600 !important;
    font-size: 1.125rem !important;
    margin: 1.5rem 0 0.75rem 0 !important;
    line-height: 1.4 !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
    padding-bottom: 0.5rem;
  }
  
  .markdown-content h3:first-child {
    margin-top: 0 !important;
  }
  
  .markdown-content ul {
    margin: 1rem 0 1.5rem 0 !important;
    padding-left: 0 !important;
    list-style: none !important;
  }
  
  .markdown-content li {
    margin: 0.5rem 0 !important;
    color: #ffffff !important;
    display: flex !important;
    align-items: flex-start !important;
    line-height: 1.6 !important;
  }
  
  .markdown-content li span:first-child {
    background: linear-gradient(135deg, #ff5f6d 0%, #ffc371 20%, #47cf73 40%, #00c6ff 60%, #845ec2 80%, #d65db1 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-right: 0.5rem !important;
    margin-top: 0.1rem !important;
    flex-shrink: 0 !important;
  }
  
  .markdown-content strong {
    color: #ffffff !important;
    font-weight: 600 !important;
  }
  
  .markdown-content em {
    color: #ffffff !important;
    font-style: italic !important;
    opacity: 0.8;
  }
  
  .markdown-content p {
    margin: 0 0 1rem 0 !important;
    line-height: 1.7 !important;
    color: #ffffff !important;
  }
  
  .markdown-content p:last-child {
    margin-bottom: 0 !important;
  }

  /* Enhanced scrollbar styling */
  .scrollbar-thin {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.2) rgba(0, 0, 0, 0.5);
  }
  
  .scrollbar-thin::-webkit-scrollbar {
    width: 8px;
  }
  
  .scrollbar-thin::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.8);
    border-radius: 4px;
    margin: 4px 0;
  }
  
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
  }
  
  .scrollbar-thin::-webkit-scrollbar-corner {
    background: rgba(0, 0, 0, 0.8);
  }
`

// Comprehensive markdown processing function
function processMarkdownContent(content: string): string {
  if (!content) return ''
  
  // Step 1: Normalize line breaks and clean up spacing
  let processed = content
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  
  // Step 2: Split content into blocks (paragraphs, headers, lists)
  const blocks = processed.split('\n\n').map(block => block.trim()).filter(Boolean)
  
  // Step 3: Process each block according to its type
  const processedBlocks = blocks.map(block => {
    // Check if block is a header (starts with ** and ends with **)
    if (block.match(/^\*\*.*\*\*:?\s*$/)) {
      const headerText = block.replace(/^\*\*(.*?)\*\*:?\s*$/, '$1').trim()
      return `<h3 class="text-white font-semibold text-lg mt-6 mb-3 first:mt-0">${headerText}</h3>`
    }
    
    // Check if block contains bullet points (both • and * formats)
    if (block.includes('•') || block.includes('* ') || block.match(/^[\s]*[•*]/m)) {
      const lines = block.split('\n')
      const listItems = lines
        .filter(line => line.trim().startsWith('•') || line.trim().startsWith('* '))
        .map(line => {
          const itemText = line.replace(/^[\s]*[•*][\s]*/, '').trim()
          // Process inline formatting within list items (avoid conflicts with bullet *)
          const formattedText = itemText
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
            // Only process single * for italics if it's not at the start of a line
            .replace(/(?<!^|\s)\*(.*?)\*(?!\s|$)/g, '<em class="text-white/80 italic">$1</em>')
          return `<li class="flex items-start space-x-2 mb-2"><span class="text-white mt-1 flex-shrink-0">•</span><span class="text-white">${formattedText}</span></li>`
        })
      
      if (listItems.length > 0) {
        return `<ul class="space-y-1 mb-6">${listItems.join('')}</ul>`
      }
    }
    
    // Regular paragraph processing
    const paragraphText = block
      // Process bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      // Process italic text
      .replace(/\*(.*?)\*/g, '<em class="text-white/80 italic">$1</em>')
      // Process line breaks within paragraphs
      .replace(/\n/g, '<br>')
    
    return `<p class="text-white mb-4 leading-relaxed">${paragraphText}</p>`
  })
  
  return processedBlocks.join('')
}

export function ExplorerMode() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [hasStartedChat, setHasStartedChat] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    console.log('🔄 Attempting to scroll to bottom...')
    if (messagesEndRef.current) {
      console.log('📍 Scrolling to messagesEndRef element')
      // Try multiple scroll methods for better compatibility
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
      
      // Fallback: scroll to bottom of container
      setTimeout(() => {
        const container = messagesEndRef.current?.parentElement?.parentElement
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      }, 100)
    } else {
      console.log('❌ messagesEndRef.current is null')
    }
  }

  useEffect(() => {
    console.log('📝 Messages updated, count:', messages.length)
    scrollToBottom()
  }, [messages])

  // Also scroll when loading state changes
  useEffect(() => {
    if (isLoading) {
      console.log('⏳ Loading state changed, scrolling...')
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    }
  }, [isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: query.trim(),
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setQuery('')
    setIsLoading(true)
    setHasStartedChat(true)
    
    try {
      const response = await fetch('/api/ocean/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: userMessage.content, 
          user_type: 'general',
          mode: 'explorer'
        })
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      // Debug: Log the API response to understand the structure
      console.log('🔍 ExplorerMode - API Response:', result)
      console.log('🔍 ExplorerMode - Summary:', result.summary)
      console.log('🔍 ExplorerMode - Analysis:', result.analysis)
      console.log('🔍 ExplorerMode - Conversational Insights:', result.conversational_insights)
      console.log('🔍 ExplorerMode - Debug Info:', result.debug)
      
      // Handle different response structures
      let content = result.summary || result.analysis?.summary || 'No analysis available for this query.'
      
      // If we have conversational insights, format them nicely
      if (result.conversational_insights && result.conversational_insights.length > 0) {
        content += '\n\n**Key Insights:**\n'
        result.conversational_insights.forEach((insight: any, index: number) => {
          content += `• **${insight.title || `Insight ${index + 1}`}**: ${insight.content}\n`
        })
      }
      
      // Add data summary if available
      if (result.data_summary && result.data_summary.hasData) {
        content += `\n\n**Data Summary:**\n`
        content += `• **Profiles**: ${result.data_summary.profileCount || 0} ocean measurements\n`
        if (result.data_summary.timeRange) {
          content += `• **Time Range**: ${result.data_summary.timeRange.start} to ${result.data_summary.timeRange.end}\n`
        }
        if (result.data_summary.region) {
          content += `• **Region**: ${result.data_summary.region}\n`
        }
      }
      
      // Fallback: If no content was generated, provide a helpful response
      if (!content || content === 'No analysis available for this query.') {
        content = `I understand you're asking about "${userMessage.content}". Let me provide some information about this topic based on ocean science knowledge.`
        
        // Add some basic information based on the query
        if (userMessage.content.toLowerCase().includes('salinity')) {
          content += `\n\n**What is Ocean Salinity?**\n`
          content += `• **Definition**: Salinity is the measure of dissolved salts in seawater\n`
          content += `• **Units**: Measured in Practical Salinity Units (PSU) or parts per thousand (ppt)\n`
          content += `• **Typical Range**: 32-37 PSU in most ocean regions\n`
          content += `• **Importance**: Affects ocean density, circulation, and marine life\n`
          content += `• **Factors**: Evaporation, precipitation, river input, and ice formation\n`
        }
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: content,
        timestamp: new Date().toISOString(),
        region: result.region || result.data_summary?.region,
        learning_score: result.learning_score || result.confidence_score,
        insights_used: result.insights_used,
        ai_enhanced: result.ai_enhanced,
        typo_corrections: result.typo_corrections,
        original_query: result.original_query,
        corrected_query: result.corrected_query,
        detected_intents: result.detected_intents,
        suggestions: result.suggestions,
        response_style: result.response_style,
        conversational_insights: result.conversational_insights,
        educational_context: result.educational_context,
        interactive_elements: result.interactive_elements
      }
      
      setMessages(prev => [...prev, assistantMessage])
      
      // Ensure scroll happens after message is added
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    } catch (error) {
      console.error('Error fetching data:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again or rephrase your question.',
        timestamp: new Date().toISOString(),
        region: 'Error'
      }
      setMessages(prev => [...prev, errorMessage])
      
      // Ensure scroll happens after error message is added
      setTimeout(() => {
        scrollToBottom()
      }, 100)
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickQuery = (quickQuery: string) => {
    setQuery(quickQuery)
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  const quickQueries = [
    "How do oceans affect weather?",
    "What causes ocean currents?", 
    "Why is ocean salinity important?",
    "How do scientists study the ocean?",
    "What lives in the deep ocean?",
    "How do oceans help climate?"
  ]


  if (!hasStartedChat) {
    // Initial elegant interface for new users
    return (
      <div className="w-full max-w-4xl mx-auto px-6 py-8 h-full flex flex-col justify-center">
        <style dangerouslySetInnerHTML={{ __html: customStyles }} />
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient-x bg-[length:200%_200%]">
              The Ocean Speaks. We Listen
            </span>
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
            Ask any ocean question in natural language - from "what is ocean" to detailed analysis. Get AI-powered insights from global Argovis data.
          </p>
        </div>

        {/* Search Section */}
        <div className="mb-12">
          <form onSubmit={handleSubmit} className="relative">
            <div className="glass-input-container p-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5 z-10" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask me anything about oceans - How do they work? Why are they important?"
                  className="glass-input w-full pl-12 pr-32 py-4 text-lg rounded-2xl focus:outline-none focus:rounded-3xl transition-all duration-500"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className={`absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 transition-all duration-200 font-medium backdrop-blur-sm border z-10 hover:rounded-xl active:rounded-xl ${
                    query.trim() 
                      ? 'bg-white text-black border-white hover:bg-gray-100' 
                      : 'bg-black text-white border-white/20 hover:border-white/40'
                  }`}
                >
                  {isLoading ? 'Analyzing...' : 'Ask'}
                </button>
              </div>
            </div>
          </form>

          {/* Quick Questions */}
          <div className="mt-6">
            <p className="text-sm text-white/60 mb-3 text-center">Try asking:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {quickQueries.map((q, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuery(q)}
                  className="ask-button text-sm px-3 py-2 backdrop-blur-sm"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    )
  }

  // Natural conversation interface after first query
  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto" style={{ height: '100vh', maxHeight: '100vh' }}>
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      {/* Minimal Header */}
        <div className="flex-shrink-0 px-4 py-2 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-gradient-to-r from-white/60 to-white/80 rounded-full"></div>
            <span className="text-sm text-white/60">Exploring ocean data with real-time insights</span>
          </div>
          <button 
            onClick={() => {
              setMessages([])
              setHasStartedChat(false)
            }}
            className="text-xs text-white/40 hover:text-white/80 transition-colors"
          >
            New conversation
          </button>
        </div>
      </div>

      {/* Conversation Flow */}
        <div 
          className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-black/50 relative" 
          style={{ 
            minHeight: '200px',
            maxHeight: 'calc(100vh - 200px)',
            height: 'auto'
          }}
        >
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message) => (
            <div key={message.id} className="space-y-4">
              {message.type === 'user' ? (
                <div className="flex justify-end">
                  <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 max-w-[70%]">
                    <p className="text-white font-medium">{message.content}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Main Response */}
                  <div className="prose prose-invert max-w-none">
                    <div 
                      className="text-white leading-relaxed text-base markdown-content"
                      dangerouslySetInnerHTML={{
                        __html: processMarkdownContent(message.content)
                      }}
                    />
                  </div>

                  {/* Typo Corrections Display */}
                  {message.typo_corrections && message.typo_corrections.length > 0 && (
                    <div className="bg-black/50 border border-white/20/50 rounded-lg p-3 text-sm">
                      <div className="text-white font-medium mb-2 flex items-center">
                        <Sparkles className="w-4 h-4 mr-1" />
                        I understood your query as:
                      </div>
                      <div className="text-white">
                        "{message.corrected_query}"
                      </div>
                      {message.typo_corrections.length > 0 && (
                        <div className="mt-2 text-xs text-white/60">
                          Auto-corrected: {message.typo_corrections.map(c => `${c.original}→${c.corrected}`).join(', ')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Conversational Insights */}
                  {message.conversational_insights && message.conversational_insights.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-white font-medium text-sm">Key Insights</h4>
                      <div className="grid gap-3">
                        {message.conversational_insights.map((insight, idx) => (
                          <div key={idx} className="bg-black/50 border border-white/20/50 rounded-lg p-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-lg">{insight.icon}</span>
                              <span className="text-white font-medium text-sm">{insight.title}</span>
                            </div>
                            <p className="text-white/80 text-sm">{insight.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Educational Context */}
                  {message.educational_context && (
                    <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                      <h4 className="text-white font-medium text-sm mb-3 flex items-center">
                        📚 Learn More About {message.educational_context.region_info?.name}
                      </h4>
                      {message.educational_context.region_info?.fun_facts && (
                        <ul className="space-y-1 text-sm text-white/80">
                          {message.educational_context.region_info.fun_facts.map((fact: string, idx: number) => (
                            <li key={idx} className="flex items-start space-x-2">
                              <span className="text-white mt-1">•</span>
                              <span>{fact}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* Interactive Elements */}
                  {message.interactive_elements && message.interactive_elements.length > 0 && (
                    <div className="space-y-3">
                      {message.interactive_elements.map((element, idx) => (
                        <div key={idx}>
                          {element.type === 'follow_up_questions' && (
                            <div>
                              <h4 className="text-white font-medium text-sm mb-2">You might also ask:</h4>
                              <div className="flex flex-wrap gap-2">
                                {element.suggestions.map((suggestion: string, sidx: number) => (
                                  <button
                                    key={sidx}
                                    onClick={() => handleQuickQuery(suggestion)}
                                    className="px-3 py-1 bg-gradient-to-r from-cyan-400/10 to-purple-500/10 hover:from-cyan-400/20 hover:to-purple-500/20 border border-white/20 rounded-full text-xs text-white transition-all duration-300 backdrop-blur-sm"
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Metadata */}
                  {message.region && (
                    <div className="flex items-center space-x-4 text-xs text-white/40 pt-2 border-t border-white/10/50">
                      <span>📍 {message.region.replace('_', ' ').toUpperCase()}</span>
                      <span>🕒 {new Date(message.timestamp).toLocaleString()}</span>
                      {message.ai_enhanced && (
                        <span className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          <span>AI-Enhanced</span>
                        </span>
                      )}
                      {message.learning_score !== undefined && (
                        <span className="flex items-center space-x-1">
                          <span>🧠 Confidence: {(message.learning_score * 100).toFixed(0)}%</span>
                        </span>
                      )}
                      {message.detected_intents && Object.keys(message.detected_intents).length > 0 && (
                        <span className="flex items-center space-x-1">
                          <span>🎯 {Object.keys(message.detected_intents).join(', ')}</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {/* Natural loading indicator */}
          {isLoading && (
            <div className="space-y-3">
              <div className="text-white/60 text-sm">Analyzing ocean data...</div>
              <div className="flex space-x-1">
                <div className="w-1 h-8 bg-white/30 rounded animate-pulse"></div>
                <div className="w-1 h-6 bg-white/30 rounded animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-4 bg-white/30 rounded animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1 h-6 bg-white/30 rounded animate-pulse" style={{ animationDelay: '0.3s' }}></div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Manual scroll to bottom button */}
        {messages.length > 0 && (
          <div className="absolute bottom-20 right-4">
            <button
              onClick={scrollToBottom}
              className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-full shadow-lg transition-all duration-200 backdrop-blur-sm"
              title="Scroll to bottom"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Natural Input Section - Compact */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="relative">
            <div className="glass-input-container p-1">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What would you like to learn about the ocean?"
                  className="glass-input w-full pl-4 pr-12 py-4 text-base rounded-2xl focus:outline-none focus:rounded-3xl transition-all duration-500"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2.5 transition-all duration-200 backdrop-blur-sm border z-10 hover:scale-105 hover:shadow-lg active:scale-95 hover:rounded-xl active:rounded-xl ${
                    query.trim() 
                      ? 'bg-white text-black border-white hover:bg-gray-100 hover:shadow-white/20' 
                      : 'bg-black text-white border-white/20 hover:border-white/40'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
