import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { VehicleForm } from "./form";
import { createVehicleRequest } from "./contracts";

afterEach(cleanup);
it("submits vehicle identity and student capacity without fields from the old schema", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<VehicleForm busy={false} onSubmit={onSubmit} onCancel={() => {}}/>);
    fireEvent.change(screen.getByLabelText("Mã xe"), { target: { value: "BUS001" } });
    fireEvent.change(screen.getByLabelText("Biển số"), { target: { value: "51A-12345" } });
    fireEvent.change(screen.getByLabelText("Sức chứa học sinh"), { target: { value: "20" } });
    fireEvent.click(screen.getByRole("button", { name: "Lưu" }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(createVehicleRequest(onSubmit.mock.calls[0]![0])).toEqual({ path: "/buses", method: "POST", body: { code: "BUS001", plateNumber: "51A-12345", studentCapacity: 20, status: "AVAILABLE", description: null } });
});
