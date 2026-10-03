# GuardianWay Mobile

Ứng dụng Expo/React Native dành cho trải nghiệm mobile của GuardianWay. UI foundation dùng React Native primitives, semantic token và component riêng thay vì một UI kit tổng hợp.

## Chạy ứng dụng

```bash
npm install
npx expo start
```

Ứng dụng ưu tiên Android và iOS. Bản web được giữ để smoke-test nhanh component.

## Đăng nhập mobile

Sao chép `.env.example` thành `.env`, rồi đặt `EXPO_PUBLIC_API_URL` thành địa chỉ backend mà thiết bị hoặc emulator truy cập được. Backend local mặc định lắng nghe cổng `8000`; không dùng `localhost` trên thiết bị vật lý nếu backend chạy trên máy phát triển.

Đăng nhập hỗ trợ tài khoản `DRIVER` và `PARENT`. Refresh token được lưu qua SecureStore trên iOS/Android; access token chỉ giữ trong memory. Bản web chỉ dùng để kiểm tra giao diện và build, không lưu session bền vững.

## Quy tắc UI

- Nguồn thiết kế: [`../DESIGN.md`](../DESIGN.md).
- Dùng `useTheme()` và token dùng chung; không đặt màu thương hiệu trực tiếp trong screen/component.
- Dùng `AppText`, `Screen`, `Stack` và component trong `src/components/ui`.
- Orange chỉ dành cho focus, selected marker và chi tiết nhấn. Primary action dùng Navy.
- Route `/design-system` và tab “Thành phần” chỉ tồn tại để kiểm thử trong development.
- Chỉ thêm form, bottom sheet, date picker hoặc thư viện chuyên dụng khi đã có workflow thực. Cài Expo-compatible package bằng `npx expo install`.

## Kiểm tra trước khi hoàn tất thay đổi

```bash
npm run lint
npx tsc --noEmit
npx expo-doctor
npx expo export --platform web
```
