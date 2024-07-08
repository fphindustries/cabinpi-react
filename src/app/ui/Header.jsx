import { Nav, NavItem } from "react-bootstrap";
export default function Header() {
  return (
    <header className="d-flex justify-content-center py-3">
      <Nav>
        <NavItem>
          <a href="/" className="nav-link" aria-current="page">
            Home
          </a>
        </NavItem>
        <NavItem>
          {" "}
          <a href="/images" className="nav-link">
            Images
          </a>
        </NavItem>
        <NavItem>
          {" "}
          <a href="/charts/solar" className="nav-link">
            Charts
          </a>
        </NavItem>        
      </Nav>
    </header>
  );
}
