import React from 'react';
import classNames from 'classnames/bind';
import { Send, Image, User, Search } from 'lucide-react';
import styles from './ChatKhachHang.module.scss';

const cx = classNames.bind(styles);

const ChatKhachHang = () => {
  return (
    <div className={cx('chatContainer')}>
      {/* Sidebar Chat */}
      <div className={cx('chatSidebar')}>
        <div className={cx('chatSearch')}>
          <Search size={16} />
          <input type="text" placeholder="Tìm tên khách hàng..." />
        </div>
        <div className={cx('conversationList')}>
          {[1, 2, 3].map((item) => (
            <div key={item} className={cx('conversationItem', { active: item === 1 })}>
              <div className={cx('avatar')}>
                <User size={20} />
              </div>
              <div className={cx('convInfo')}>
                <div className={cx('convHeader')}>
                  <span className={cx('name')}>Anh Hoàng</span>
                  <span className={cx('time')}>10:45</span>
                </div>
                <p className={cx('lastMsg')}>Shop ơi, em muốn đổi giờ cắt sang 5h...</p>
              </div>
              {item === 1 && <span className={cx('unreadBadge')} />}
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Window */}
      <div className={cx('chatWindow')}>
        <div className={cx('windowHeader')}>
          <div className={cx('userInfo')}>
            <strong>Anh Hoàng</strong>
            <span>Đang hoạt động</span>
          </div>
        </div>
        
        <div className={cx('messageArea')}>
          <div className={cx('msgRow', 'received')}>
            <div className={cx('msgBubble')}>Chào shop, mình có lịch lúc 4h chiều nay ạ.</div>
          </div>
          <div className={cx('msgRow', 'sent')}>
            <div className={cx('msgBubble')}>Dạ vâng chào anh, Barber Lab đã nhận lịch của anh rồi ạ!</div>
          </div>
        </div>

        <div className={cx('inputArea')}>
          <button className={cx('attachBtn')}><Image size={20} /></button>
          <input type="text" placeholder="Nhập tin nhắn..." />
          <button className={cx('sendBtn')}><Send size={20} /></button>
        </div>
      </div>
    </div>
  );
};

export default ChatKhachHang;