import { realtimeEmitter, RealtimeEvent } from '@/lib/realtime';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const channel = searchParams.get('channel') || 'all';

    const encoder = new TextEncoder();
    let unsubscribe: (() => void) | null = null;
    let pingInterval: NodeJS.Timeout | null = null;
    let isClosed = false;
    
    const stream = new ReadableStream({
        start(controller) {
            // Send initial connection message
            try {
                controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: 'connected', channel, timestamp: Date.now() })}\n\n`)
                );
            } catch {
                return;
            }

            // Keep-alive ping every 15 seconds
            pingInterval = setInterval(() => {
                if (isClosed) {
                    if (pingInterval) clearInterval(pingInterval);
                    return;
                }
                try {
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: 'ping', timestamp: Date.now() })}\n\n`)
                    );
                } catch {
                    isClosed = true;
                    if (pingInterval) clearInterval(pingInterval);
                    if (unsubscribe) unsubscribe();
                }
            }, 15000);

            // Subscribe to events
            unsubscribe = realtimeEmitter.subscribe(channel, (event: RealtimeEvent) => {
                if (isClosed) return;
                try {
                    controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
                    );
                } catch {
                    isClosed = true;
                    if (pingInterval) clearInterval(pingInterval);
                    if (unsubscribe) unsubscribe();
                }
            });
        },
        cancel() {
            isClosed = true;
            if (pingInterval) clearInterval(pingInterval);
            if (unsubscribe) unsubscribe();
        }
    });

    // Handle abort signal
    request.signal.addEventListener('abort', () => {
        isClosed = true;
        if (pingInterval) clearInterval(pingInterval);
        if (unsubscribe) unsubscribe();
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    });
}
