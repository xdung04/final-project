import React from 'react';
import classNames from 'classnames/bind';
import { Download, Filter, FileText, Search, CreditCard, Wallet, BadgeDollarSign, Calendar } from 'lucide-react';
import styles from './LichSuGiaoDich.module.scss';

const cx = classNames.bind(styles);

const LichSuGiaoDich = () => {
  const transactions = [
    { 
      idBooking: 101, 
      customerName: 'Nguyễn Văn Nam', 
      barberName: 'Barber Nam', 
      total: 550000, 
      bookingDate: '11/04/2025', 
      bookingTime: '14:30', 
      status: 'Completed', 
      paymentMethod: 'Transfer' 
    },
    { 
      idBooking: 102, 
      customerName: 'Trần Minh Khôi', 
      barberName: 'Barber Tuấn', 
      total: 850000, 
      bookingDate: '11/04/2025', 
      bookingTime: '15:15', 
      status: 'Completed', 
      paymentMethod: 'Cash' 
    },
    { 
      idBooking: 103, 
      customerName: 'Lê Tuấn Anh', 
      barberName: 'Barber Khiêm', 
      total: 200000, 
      bookingDate: '11/04/2025', 
      bookingTime: '16:00', 
      status: 'Cancelled', 
      paymentMethod: 'Cash' 
    },
  ];

  return (
    <div className={cx('historyWrapper')}>
      {/* 1. Thống kê nhanh - Đã thêm statInfo để căn chỉnh text */}
      <div className={cx('statsGrid')}>
        <div className={cx('statCard', 'gold')}>
          <div className={cx('statIcon')}><BadgeDollarSign size={24} /></div>
          <div className={cx('statInfo')}>
            <p className={cx('label')}>Tổng doanh thu</p>
            <h2 className={cx('value')}>1.600.000đ</h2>
            <p className={cx('subLabel')}>Hôm nay</p>
          </div>
        </div>

        <div className={cx('statCard')}>
          <div className={cx('statIcon')}><CreditCard size={24} /></div>
          <div className={cx('statInfo')}>
            <p className={cx('label')}>Chuyển khoản</p>
            <h2 className={cx('value')}>550.000đ</h2>
            <p className={cx('subLabel')}>1 giao dịch</p>
          </div>
        </div>

        <div className={cx('statCard')}>
          <div className={cx('statIcon')}><Wallet size={24} /></div>
          <div className={cx('statInfo')}>
            <p className={cx('label')}>Tiền mặt</p>
            <h2 className={cx('value')}>1.050.000đ</h2>
            <p className={cx('subLabel')}>2 giao dịch</p>
          </div>
        </div>
      </div>

      {/* 2. Bộ lọc & Hành động - Đồng bộ hóa SearchBox và Action Buttons */}
      <div className={cx('filterSection')}>
        <div className={cx('searchBox')}>
          <Search size={18} className={cx('searchIcon')} />
          <input type="text" placeholder="TÌM TÊN KHÁCH, MÃ ĐƠN..." />
        </div>

        <div className={cx('actions')}>
          <div className={cx('dateFilter')}>
             <input type="date" className={cx('dateInput')} />
          </div>
          <button className={cx('btnOutline')}>
            <Filter size={16} /> <span>LỌC</span>
          </button>
          <button className={cx('btnSolid')}>
            <Download size={16} /> <span>XUẤT FILE</span>
          </button>
        </div>
      </div>

      {/* 3. Bảng hiển thị chính - Cấu trúc Table Luxury */}
      <div className={cx('tableContainer')}>
        <table className={cx('luxuryTable')}>
          <thead>
            <tr>
              <th>THỜI GIAN</th>
              <th>KHÁCH HÀNG</th>
              <th>THỢ CHÍNH</th>
              <th>THANH TOÁN</th>
              <th>TỔNG TIỀN</th>
              <th>TRẠNG THÁI</th>
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

                <td>
                  <div className={cx('customerInfo')}>
                    <span className={cx('code')}>#{tr.idBooking}</span>
                    <strong className={cx('customerName')}>{tr.customerName}</strong>
                  </div>
                </td>

                <td className={cx('barber')}>
                  <span className={cx('barberName')}>{tr.barberName}</span>
                </td>

                <td>
                  <span className={cx('methodTag', tr.paymentMethod.toLowerCase())}>
                    {tr.paymentMethod === 'Transfer' ? 'Chuyển khoản' : 'Tiền mặt'}
                  </span>
                </td>

                <td className={cx('amount')}>
                  {tr.total.toLocaleString('vi-VN')}đ
                </td>

                <td>
                  <span className={cx('statusTag', tr.status.toLowerCase())}>
                    {tr.status === 'Completed' ? 'Hoàn tất' : 'Đã hủy'}
                  </span>
                </td>

                <td>
                  <button className={cx('actionBtn')} title="Chi tiết">
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