import React, { useState } from 'react';
import classNames from 'classnames/bind';
import { Download, Filter, FileText, Search, CreditCard, Wallet, BadgeDollarSign } from 'lucide-react';
import styles from './LichSuGiaoDich.module.scss';

const cx = classNames.bind(styles);

const LichSuGiaoDich = () => {
  // Giả lập dữ liệu từ API bookings của bạn
  const transactions = [
    { 
      idBooking: 101, 
      customerName: 'Nguyễn Văn Nam', 
      barberName: 'Barber Nam', 
      total: '550.000', 
      bookingDate: '2025-04-11', 
      bookingTime: '14:30', 
      status: 'Completed', 
      paymentMethod: 'Transfer' 
    },
    { 
      idBooking: 102, 
      customerName: 'Trần Minh Khôi', 
      barberName: 'Barber Tuấn', 
      total: '850.000', 
      bookingDate: '2025-04-11', 
      bookingTime: '15:15', 
      status: 'Completed', 
      paymentMethod: 'Cash' 
    },
    { 
      idBooking: 103, 
      customerName: 'Lê Tuấn Anh', 
      barberName: 'Barber Khiêm', 
      total: '200.000', 
      bookingDate: '2025-04-11', 
      bookingTime: '16:00', 
      status: 'Cancelled', 
      paymentMethod: 'Cash' 
    },
  ];

  return (
    <div className={cx('historyWrapper')}>
      {/* 1. Thống kê nhanh */}
      <div className={cx('statsGrid')}>
        <div className={cx('statCard', 'gold')}>
          <div className={cx('statIcon')}><BadgeDollarSign /></div>
          <div className={cx('statInfo')}>
            <span className={cx('label')}>Tổng doanh thu</span>
            <h2 className={cx('value')}>1.600.000đ</h2>
          </div>
        </div>
        <div className={cx('statCard')}>
          <div className={cx('statIcon')}><CreditCard /></div>
          <div className={cx('statInfo')}>
            <span className={cx('label')}>Chuyển khoản</span>
            <h2 className={cx('value')}>550.000đ</h2>
            <p className={cx('subLabel')}>1 giao dịch</p>
          </div>
        </div>
        <div className={cx('statCard')}>
          <div className={cx('statIcon')}><Wallet /></div>
          <div className={cx('statInfo')}>
            <span className={cx('label')}>Tiền mặt</span>
            <h2 className={cx('value')}>1.050.000đ</h2>
            <p className={cx('subLabel')}>2 giao dịch</p>
          </div>
        </div>
      </div>

      {/* 2. Bộ lọc & Hành động */}
      <div className={cx('filterSection')}>
        <div className={cx('searchBox')}>
          <Search size={18} />
          <input type="text" placeholder="Tìm tên khách, mã đơn..." />
        </div>
        <div className={cx('actions')}>
          <div className={cx('dateFilter')}>
             <input type="date" className={cx('dateInput')} />
          </div>
          <button className={cx('btnOutline')}><Filter size={16} /> Lọc</button>
          <button className={cx('btnSolid')}><Download size={16} /> Xuất file</button>
        </div>
      </div>

      {/* 3. Bảng hiển thị chính */}
      <div className={cx('tableContainer')}>
{/* Trong bảng, ta thay cột Mã đơn bằng ID hoặc chỉ đơn giản là số thứ tự */}
<table className={cx('luxuryTable')}>
  <thead>
    <tr>

      <th>Thời gian</th>
      <th>Khách hàng</th>
      <th>Thợ chính</th>
      <th>Thanh toán</th>
      <th>Tổng tiền</th>
      <th>Trạng thái</th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    {transactions.map((tr) => (
      <tr key={tr.idBooking}>
        
        
        <td className={cx('time')}>
          <span className={cx('hour')}>{tr.bookingTime}</span>
          <span className={cx('date')}>{tr.bookingDate}</span>
        </td>

        <td className={cx('name')}>
          <strong>{tr.customerName}</strong>
          {/* Bạn có thể thêm ghi chú/mô tả nhỏ ở đây nếu cần */}
        </td>

        <td className={cx('barber')}>{tr.barberName}</td>

        <td>
          <span className={cx('methodTag', tr.paymentMethod?.toLowerCase())}>
            {tr.paymentMethod === 'Transfer' ? 'Chuyển khoản' : 'Tiền mặt'}
          </span>
        </td>

        <td className={cx('amount')}>
          {/* Format tiền tệ đơn giản */}
          {Number(tr.total).toLocaleString('vi-VN')}đ
        </td>

        <td>
          <span className={cx('statusTag', tr.status.toLowerCase())}>
            {tr.status === 'Completed' ? 'Hoàn tất' : 'Đã hủy'}
          </span>
        </td>

        <td>
          <button className={cx('actionBtn')} title="Xem chi tiết dịch vụ">
            <FileText size={18} />
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
      </div>
    </div>
  );
};

export default LichSuGiaoDich;