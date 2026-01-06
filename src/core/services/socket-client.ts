import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initSocket = (token: string) => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  // Kết nối tới namespace /chat
  socket = io('http://localhost:8080/chat', {
    transports: ['websocket'],
    // Gửi đủ cả token + Authorization cho chắc,
    // socketAuth có đọc cái nào thì cũng có dữ liệu
    auth: {
      token, // TH phổ biến: socket.handshake.auth.token
      Authorization: `Bearer ${token}`, // TH anh đang dùng: socket.handshake.auth.Authorization
    },
  });

  // Log lỗi handshake nếu có
  socket.on('connect_error', (err: any) => {
    console.error('[socket] connect_error:', err?.message || err);
  });

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
