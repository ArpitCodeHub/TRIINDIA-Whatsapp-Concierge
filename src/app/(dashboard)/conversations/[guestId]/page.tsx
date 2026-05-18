'use client'

import { useEffect, useState, useRef } from 'react'
import { getSupabase } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Send } from 'lucide-react'
import type { Message, Guest } from '@/types'
import Link from 'next/link'

export default function ConversationDetailPage({ params }: { params: Promise<{ guestId: string }> }) {
  const [resolvedParams, setResolvedParams] = useState<{ guestId: string } | null>(null)
  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  const [messages, setMessages] = useState<Message[]>([])
  const [guest, setGuest] = useState<Guest | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState('active')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!resolvedParams) return
    fetchMessages()
  }, [resolvedParams])

  useEffect(() => {
    if (!resolvedParams) return

    const channel = getSupabase()
      .channel(`conversation-${resolvedParams.guestId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      getSupabase().removeChannel(channel)
    }
  }, [resolvedParams])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function fetchMessages() {
    if (!resolvedParams) return

    const { data: conv } = await getSupabase()
      .from('conversations')
      .select('guest_id, status')
      .eq('id', resolvedParams.guestId)
      .single()

    if (conv) {
      setStatus(conv.status as string)

      const { data: msgs } = await getSupabase()
        .from('messages')
        .select('*')
        .eq('conversation_id', resolvedParams.guestId)
        .order('created_at', { ascending: true })

      setMessages((msgs || []) as Message[])

      const guestId = (conv as any).guest_id as string
      if (guestId) {
        const { data: g } = await getSupabase()
          .from('guests')
          .select('*')
          .eq('id', guestId)
          .single()
        setGuest((g || null) as Guest | null)
      }
    }
  }

  async function handleSend() {
    if (!reply.trim() || !guest || sending) return
    setSending(true)

    try {
      const res = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: guest.phone,
          message: reply,
          conversationId: resolvedParams?.guestId,
          guestId: guest.id,
        }),
      })

      if (res.ok) {
        setReply('')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSending(false)
    }
  }

  async function handleEscalate() {
    if (!resolvedParams) return
    await fetch('/api/escalate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: resolvedParams.guestId, reason: 'Manual escalation' }),
    })
    setStatus('escalated')
  }

  async function handleResolve() {
    if (!resolvedParams) return
    await getSupabase()
      .from('conversations')
      .update({ status: 'resolved' as any })
      .eq('id', resolvedParams.guestId)
    setStatus('resolved')
  }

  if (!resolvedParams) return null

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] sm:h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            href="/conversations"
            className="flex-shrink-0 p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 sm:hidden"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white truncate">
              {guest?.name || 'Guest'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{guest?.phone}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <Badge
            variant={status === 'escalated' ? 'danger' : status === 'resolved' ? 'success' : 'info'}
            className="text-xs"
          >
            {status}
          </Badge>
          {status !== 'resolved' && (
            <>
              {status !== 'escalated' && (
                <Button variant="destructive" size="sm" onClick={handleEscalate} className="hidden sm:inline-flex">
                  Escalate
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={handleResolve} className="hidden sm:inline-flex">
                Resolve
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">No messages yet</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'guest' ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-md px-3 sm:px-4 py-2 rounded-lg text-sm ${
                  msg.role === 'guest'
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    : msg.role === 'human'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100'
                }`}
              >
                <p className="break-words">{msg.content}</p>
                <p className="text-xs mt-1 opacity-60">
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                {msg.intent && msg.role === 'ai' && (
                  <Badge variant="default" className="mt-1 text-xs">
                    {msg.intent}
                  </Badge>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-3 sm:mt-4 flex gap-2">
        <input
          type="text"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a reply..."
          className="flex-1 px-3 sm:px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button onClick={handleSend} disabled={sending || !reply.trim()} className="px-3 sm:px-4">
          {sending ? (
            '...'
          ) : (
            <>
              <span className="hidden sm:inline">Send</span>
              <Send className="w-4 h-4 sm:hidden" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
