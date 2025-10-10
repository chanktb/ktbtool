import os
import re

def rename_tool():
    # In hướng dẫn regex
    print("📌 Một số ví dụ regex hay dùng:")
    print(" - Cắt số ở đầu: ^\\d+")
    print(" - Cắt số ở đuôi: \\d+$")
    print(" - Cắt text cụ thể ở đầu (vd: ABC): ^ABC")
    print(" - Cắt text cụ thể ở đuôi (vd: XYZ): XYZ$")
    print(" - Cắt mọi thứ từ đầu đến ký tự - : ^.*?-")
    print(" - Cắt mọi thứ từ từ cuối tới ký tự -: -[^-]*$")
    print("-" * 50)

    # Nhập folder cần đổi
    folder = input("Nhập đường dẫn tới folder cần đổi tên: ").strip()
    if not os.path.isdir(folder):
        print("❌ Thư mục không tồn tại!")
        return False  # quay lại từ đầu

    # Lấy tên file script để bỏ qua chính nó
    script_name = os.path.basename(__file__)

    # Nhập regex
    regex_head = input("Regex cắt đầu filename (Enter để bỏ qua): ").strip()
    regex_tail = input("Regex cắt cuối filename (Enter để bỏ qua): ").strip()

    # Nhập prefix/suffix
    add_head = input("Thêm gì vào đầu filename? (Enter để bỏ qua): ")
    add_tail = input("Thêm gì vào đuôi filename (trước extension)? (Enter để bỏ qua): ")

    # Lấy danh sách file trong folder
    files = [
        f for f in os.listdir(folder)
        if os.path.isfile(os.path.join(folder, f))
        and f != script_name
        and not f.lower().endswith(".bat")  # bỏ qua file .bat
    ]

    if not files:
        print("⚠️ Không có file nào để đổi tên trong folder.")
        return False  # quay lại từ đầu

    # Preview trên file đầu tiên
    sample_file = files[0]
    name, ext = os.path.splitext(sample_file)
    preview_name = name

    if regex_head:
        preview_name = re.sub(rf"^{regex_head}", "", preview_name)
    if regex_tail:
        preview_name = re.sub(rf"{regex_tail}$", "", preview_name)

    preview_name = f"{add_head}{preview_name}{add_tail}{ext}"

    print(f"\n🔎 Preview với file đầu tiên:")
    print(f"   Gốc : {sample_file}")
    print(f"   Sau : {preview_name}")

    confirm = input("\nBạn có muốn áp dụng đổi tên cho toàn bộ file? (y/n): ").strip().lower()
    if confirm != "y":
        again = input("Bạn có muốn thoát không? (y/n): ").strip().lower()
        if again == "y":
            print("❌ Đã hủy, không đổi tên file nào.")
            return True  # thoát hẳn
        else:
            print("\n↩️ Chạy lại từ đầu...\n")
            return False  # quay lại vòng lặp

    # Đổi tên tất cả file
    for filename in files:
        name, ext = os.path.splitext(filename)
        original_name = name

        # Cắt regex
        if regex_head:
            name = re.sub(rf"^{regex_head}", "", name)
        if regex_tail:
            name = re.sub(rf"{regex_tail}$", "", name)

        # Thêm đầu / đuôi
        new_name = f"{add_head}{name}{add_tail}"
        new_filename = new_name + ext

        old_path = os.path.join(folder, filename)
        new_path = os.path.join(folder, new_filename)

        os.rename(old_path, new_path)
        print(f"Đổi: {original_name+ext}  ->  {new_filename}")

    print("\n✅ Hoàn tất đổi tên!")
    return True  # xong thì thoát

if __name__ == "__main__":
    while True:
        should_exit = rename_tool()
        if should_exit:
            break
