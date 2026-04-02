"use client";

import React from "react";
import Link from "next/link";

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/50 mt-12">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-bold text-lg mb-4">⛳ Golf Charity</h3>
            <p className="text-sm text-muted-foreground">
              Track scores, win prizes, support charities.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/pricing" className="hover:text-primary transition">
                  Pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/charities"
                  className="hover:text-primary transition"
                >
                  Charities
                </Link>
              </li>
              <li>
                <Link
                  href="/#how-it-works"
                  className="hover:text-primary transition"
                >
                  How It Works
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-primary transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-primary transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Golf Charity Platform. All rights reserved.
          </p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a
              href="#"
              className="text-muted-foreground hover:text-primary transition"
            >
              Twitter
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-primary transition"
            >
              Facebook
            </a>
            <a
              href="#"
              className="text-muted-foreground hover:text-primary transition"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
