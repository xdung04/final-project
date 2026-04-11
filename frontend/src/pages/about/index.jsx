import React from "react";
import { useNavigate } from "react-router-dom";
import "./About.scss";

function About() {
  const navigate = useNavigate();

  return (
    <div className="about-page">
      <div className="grainOverlay"></div>

      {/* Banner / The Heritage */}
      <section
        className="about-banner"
        style={{
          backgroundImage: `url('/banner.png')`, // Đảm bảo ảnh của bạn có tông màu trung tính
        }}
      >
        <h1>Our Heritage</h1>
        <p>Kiến tạo phong cách - Khẳng định bản sắc</p>
      </section>

      {/* Giới thiệu */}
      <section className="about-intro">
        <div className="intro-text">
          <h2>Câu Chuyện</h2>
          <p>
            Được thành lập từ năm 2015, Barber Lab không chỉ là một tiệm cắt tóc, mà là nơi nghệ thuật tạo mẫu tóc được tôn vinh. Chúng tôi tin rằng mỗi quý ông đều xứng đáng có một diện mạo phản ánh đúng vị thế và cá tính riêng biệt.
          </p>
        </div>
        <div className="intro-image">
           {/* Bạn có thể thêm một ảnh decor ở đây nếu muốn */}
           <div style={{width: '100%', height: '400px', background: '#f5f5f5', border: '1px solid #e0d7cc'}}></div>
        </div>
      </section>

      {/* Sứ mệnh & tầm nhìn */}
      <section className="about-mission">
        <div className="mission-content">
          <h2>Tầm Nhìn & Sứ Mệnh</h2>
          <ul>
            <li>
              <strong>Sứ Mệnh</strong>
              <span>Mang đến trải nghiệm grooming thượng lưu, kết hợp giữa kỹ thuật cổ điển và xu hướng hiện đại.</span>
            </li>
            <li>
              <strong>Tầm Nhìn</strong>
              <span>Trở thành biểu tượng của phong cách sống quý ông, dẫn đầu trong việc định hình tiêu chuẩn cái đẹp nam giới.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Kêu gọi hành động */}
      <section className="about-cta">
        <h2>Trải nghiệm đẳng cấp</h2>
        <p>Hãy để các nghệ nhân của chúng tôi chăm sóc diện mạo của bạn</p>
        <button onClick={() => navigate("/booking")}>Đặt Lịch Ngay</button>
      </section>
    </div>
  );
}

export default About;