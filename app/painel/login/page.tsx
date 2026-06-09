import { redirect } from 'next/navigation'

// Login now lives on the single front door (/). Anyone hitting the old URL
// is sent there, where the staff keyword reveals the password field.
export default function LoginRedirect() {
  redirect('/')
}
