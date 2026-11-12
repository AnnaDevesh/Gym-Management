import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the shared login page for admins and trainers', () => {
  render(<App />);
  expect(
    screen.getByRole('heading', { name: /welcome back/i })
  ).toBeInTheDocument();
  expect(
    screen.getByText(/login to your admin or trainer account/i)
  ).toBeInTheDocument();
});
