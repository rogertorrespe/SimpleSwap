import { render, screen } from "@testing-library/react";

test("renders SimpleSwap title", () => {
  render(<div>SimpleSwap</div>);
  const titleElement = screen.getByText(/SimpleSwap/i);
  expect(titleElement).toBeInTheDocument();
});