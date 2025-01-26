import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="relative z-10 bg-white/5 backdrop-blur-sm py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">About Us</h3>
            <p className="text-gray-400">Building the future <br /> of AI-powered solutions.</p>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link href="/#features" className="text-gray-400 hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">About</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="text-gray-400">Email: alkalaibots@gmail.com</li>
              <li className="text-gray-400">Phone: +966 (0)54 601 3825</li>
              <li className="text-gray-400">Location: Mecca, Saudi Arabia</li>
            </ul>
          </div>
          <div className="flex justify-center md:justify-end">
            <Image
              src="/logomark.png"
              alt="AlkalaiBots Logo"
              width={120}
              height={120}
              className="opacity-80 hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
        <div className="border-t border-white/10 mt-12 pt-8 text-center text-gray-400">
          <p>&copy; 2024 AlkalaiBots. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 