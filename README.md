# 🌿 AETHERIA VOXEL: Minecraft HD Nature Sanctuary • Kỳ Quan Khối Vuông 3D

Một dự án trải nghiệm phong cảnh đồ họa **Minecraft HD Voxel** siêu nét kết hợp ánh sáng điện ảnh (Cinematic RTX Shaders) được xây dựng trên nền tảng **Three.js**, **GLSL Shaders**, **WebGL** và **Web Audio API**.

---

## ✨ Điểm Nổi Bật Về Đồ Họa Minecraft HD (Visual Highlights)

### 1. Địa Hình Khối Vuông Voxel Chuẩn Minecraft (Stepped Voxel Terrain & AO)
- Địa hình được voxel hóa 100% thành các bậc thang khối vuông 90 độ (không còn dốc trơn, đúng chất Minecraft).
- Bộ kết cấu khối (Voxel Textures) độ phân giải cao được render trực tiếp bằng Canvas Procedural Generator với bộ lọc `NearestFilter` siêu sắc nét:
  - **Khối Cỏ (Grass Block)**: Mặt trên xanh mướt đa tầng, mặt bên rễ cỏ rủ tự nhiên trên nền đất màu mỡ.
  - **Khối Cát Biển (Sand Block)**: Hạt cát vàng mịn ven biển với gợn sóng tinh tế.
  - **Khối Đá Cuội & Đá Tảng (Stone & Cobblestone)**: Vách núi đá phiến với đường rãnh khối sắc cạnh.
  - **Khối Băng Tuyết (Snow Block)**: Đỉnh núi phủ tuyết trắng tinh thể phản xạ ánh sáng.
- **Ambient Occlusion (AO) theo góc khối**: Các góc khuất giữa các khối được đổ bóng tự nhiên theo phong cách Minecraft RTX / BSL Shaders.

### 2. Rừng Cây & Hoa Cỏ Phong Cách Minecraft (Voxel Cherry & Oak Trees)
- **Cây Hoa Anh Đào (Sakura Voxel Tree)**: Thân gỗ tối màu với vân thớ gỗ và lõi hồng tâm, tán lá khối màu hồng phấn bềnh bồng với các khoảng rỗng đặc trưng Minecraft.
- **Cây Sồi (Oak Tree)**: Cây gỗ sồi xanh tươi tầng tầng lớp lớp.
- **Hoa Cỏ Chữ Thập (Cross-Plane Voxel Flowers)**: Hoa anh túc đỏ (Poppy), bồ công anh vàng (Dandelion), phong lan xanh (Blue Orchid) đung đưa tự nhiên trong gió.
- Cánh hoa anh đào rơi lả tả dưới dạng hạt voxel hồng nhẹ nhàng trôi theo làn gió.

### 3. Mặt Nước Đại Dương Khối Vuông Biển Ngọc (Minecraft Stylized Water)
- Mặt nước màu xanh ngọc bích (Cyan Turquoise) trong suốt với độ phản xạ ánh sáng cao.
- Hiệu ứng vân sáng đáy nước (Caustics) và bọt sóng pixel chuyển động nhịp nhàng.
- Nước trong vắt cho phép nhìn thấy thềm lục địa cát và đá khối bên dưới đáy biển.

### 4. Kiến Trúc Khối Vuông Nhật Bản & Đền Cổ (Voxel Architecture)
- **Cổng Torii Thần Đạo Khối Vuông**: Chế tác từ các khối đỏ sơn mài và ngói đá phiến đen uốn cong ở đuôi mái.
- **Cầu Đá Vòm Cổ Kính (Cobblestone Arch Bridge)**: Bắt qua vịnh biển với lan can đá cuội và sàn gạch đá.
- **Lồng Đèn Minecraft (Minecraft Lanterns)**: Khung sắt 3D với ngọn lửa ấm áp phát sáng rực rỡ và đổ bóng chân thực.
- **5 Bảo Tháp Hải Đăng (Minecraft Beacons)**: Đế kim tự tháp thạch anh & vàng khối, tinh thể ngọc xoay lơ lửng phóng luồng cột sáng thiên giới lên bầu trời.

### 5. Mặt Trời Vuông & Mặt Trăng Vuông Đặc Trưng (Square Celestial Bodies)
- **Mặt Trời Vuông Luminous Square Sun**: Tỏa ánh hào quang rực rỡ theo chu kỳ ngày.
- **Mặt Trăng Vuông (Square Moon)**: Có vết hố thiên thạch (Craters) tỏa ánh trăng bạc huyền ảo vào ban đêm.
- **Mây Khối 3D Bềnh Bồng (3D Volumetric Box Clouds)**: Những tầng mây hộp chữ nhật trôi nhẹ nhàng trên tầng cao, bắt ánh vàng lúc hoàng hôn và bình minh.
- Dải **Cực Quang Voxel (Aurora Borealis)** uốn lượn sắc xanh ngọc và tím vào ban đêm.

### 6. Động Vật Đáng Yêu (Voxel Wildlife)
- **Cáo Đỏ Nhật Bản (Minecraft Japanese Red Fox)**: Mô hình khối vuông với tai tam giác, mõm nhọn, mắt đen, 4 chân và chiếc đuôi xù chóp trắng đang ngắm nhìn thiên nhiên (biết cử động đầu và vẫy đuôi).
- Đàn chim khối vuông (Voxel Birds) vỗ cánh lượn quanh những tán cây hoa anh đào.

### 7. Vật Lý Người Chơi (Minecraft Step-Up Movement)
- Tự động bước lên các bậc thềm 1 khối (Step-up physics) mượt mà như trong Minecraft mà không bị kẹt cạnh khối.
- Nhảy bằng phím Space, chạy nhanh bằng Shift, âm thanh bước chân và nhịp nhún đầu (Head bobbing).

---

## 🚀 Cách Chạy Dự Án

1. Nhấp đúp vào file [`run.bat`](run.bat) để tự động mở trình duyệt tại `http://localhost:5173`.
2. Hoặc chạy lệnh trong terminal:
```bash
npm run dev
```
