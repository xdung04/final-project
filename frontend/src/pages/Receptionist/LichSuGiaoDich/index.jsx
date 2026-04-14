import React from 'react';
import classNames from 'classnames/bind';
import { Download, Filter, FileText } from 'lucide-react';
import styles from './LichSuGiaoDich.module.scss';

const cx = classNames.bind(styles);

const LichSuGiaoDich = () => {
  const transactions = [
    { id: '#BBL-8801', name: 'Nguyễn Văn Nam', service: 'Combo Đế Vương', price: '550.000đ', time: '14:30 - 11/04', status: 'completed' },
    { id: '#BBL-8802', name: 'Trần Minh Khôi', service: 'Cắt tóc & Uốn', price: '850.000đ', time: '15:15 - 11/04', status: 'completed' },
    { id: '#BBL-8803', name: 'Lê Tuấn Anh', service: 'Tỉa râu & Gội', price: '200.000đ', time: '16:00 - 11/04', status: 'canceled' },
  ];

  return (
    <div className={cx('historyContainer')}>
      <div className={cx('tableHeader')}>
        <h3 className={cx('title')}>Nhật ký giao dịch</h3>
        <div className={cx('tableActions')}>
          <button className="admin-btn-outline"><Filter size={16} /> Lọc</button>
          <button className="admin-btn"><Download size={16} /> Xuất báo cáo</button>
        </div>
      </div>

      <table className={cx('luxuryTable')}>
        <thead>
          <tr>
            <th>Mã đơn</th>
            <th>Khách hàng</th>
            <th>Dịch vụ</th>
            <th>Thời gian</th>
            <th>Giá trị</th>
            <th>Trạng thái</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tr) => (
            <tr key={tr.id}>
              <td className={cx('code')}>{tr.id}</td>
              <td className={cx('name')}>{tr.name}</td>
              <td className={cx('service')}>{tr.service}</td>
              <td className={cx('time')}>{tr.time}</td>
              <td className={cx('price')}>{tr.price}</td>
              <td>
                <span className={cx('statusTag', tr.status)}>
                  {tr.status === 'completed' ? 'Thành công' : 'Đã hủy'}
                </span>
              </td>
              <td>
                <button className={cx('viewBtn')}><FileText size={16} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default LichSuGiaoDich;