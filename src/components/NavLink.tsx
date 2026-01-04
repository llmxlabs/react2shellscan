import Link from "next/link"
import { forwardRef } from "react"
import { cn } from "@/lib/utils"

interface NavLinkProps {
  href: string
  className?: string
  children?: React.ReactNode
  activeClassName?: string
  pendingClassName?: string
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, activeClassName, pendingClassName, href, ...props }, ref) => {
    return (
      <Link
        ref={ref}
        href={href}
        className={cn(className)}
        {...props}
      />
    )
  },
)

NavLink.displayName = "NavLink"

export { NavLink }
