import { redirect } from 'next/navigation';

/** About copy now lives on the home page (`/#about`). */
export default function AboutPage() {
  redirect('/#about');
}
