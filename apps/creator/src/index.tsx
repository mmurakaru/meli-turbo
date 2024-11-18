import ReactDOM from "react-dom/client";
import Home from "./app/page";

const root = document.getElementById("root");

if (root) {
  ReactDOM.createRoot(root).render(<Home />);
}
