# GuardianWay Mobile

Ứng dụng Expo/React Native dành cho trải nghiệm mobile của GuardianWay. UI foundation dùng React Native primitives, semantic token và component riêng thay vì một UI kit tổng hợp.

## Chạy ứng dụng

```bash
npm install
npx expo start
```

Ứng dụng ưu tiên Android và iOS. Bản web được giữ để smoke-test nhanh component.

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
