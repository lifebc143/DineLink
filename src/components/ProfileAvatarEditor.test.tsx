import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import ProfileAvatarEditor from "./ProfileAvatarEditor";

describe("會員頭像編輯器", () => {
  afterEach(() => cleanup());
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn().mockReturnValue("blob:avatar-preview") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
  });

  it("限制為 JPG、PNG、WebP 且拒絕不支援格式", () => {
    render(<ProfileAvatarEditor user={{ displayName: "小安" }} onUpdated={() => undefined} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(["gif"], "avatar.gif", { type: "image/gif" })] } });
    expect(screen.getByText("請選擇 JPG、PNG 或 WebP 格式的圖片。")).not.toBeNull();
  });

  it("可預覽有效圖片並在裁切上傳成功後更新目前會員頭像", async () => {
    const onUpdated = vi.fn();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ user: { id: "member-1", displayName: "小安", avatarUrl: "/manus-storage/avatars/member-1/profile.webp" } }) }));
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => callback(new Blob(["cropped"], { type: "image/webp" })));
    Object.defineProperty(Image.prototype, "decode", { configurable: true, value: vi.fn().mockResolvedValue(undefined) });

    render(<ProfileAvatarEditor user={{ displayName: "小安" }} onUpdated={onUpdated} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(["png"], "avatar.png", { type: "image/png" })] } });
    expect(await screen.findByText("調整會員頭像")).not.toBeNull();
    fireEvent.click(screen.getByText("套用頭像"));

    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ avatarUrl: "/manus-storage/avatars/member-1/profile.webp" })));
    expect(screen.getByText("頭像更新成功！")).not.toBeNull();
  });

  it("在手機裁切視窗中保留使用安全區間距的固定確認操作列", async () => {
    render(<ProfileAvatarEditor user={{ displayName: "小安" }} onUpdated={() => undefined} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(["png"], "avatar.png", { type: "image/png" })] } });
    expect(await screen.findByRole("dialog")).not.toBeNull();
    expect(screen.getByTestId("avatar-editor-actions").className).toContain("pb-[max(0.85rem,env(safe-area-inset-bottom))]");
    expect(screen.getByText("套用頭像")).not.toBeNull();
  });
});
