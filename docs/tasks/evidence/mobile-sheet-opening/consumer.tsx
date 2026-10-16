import * as React from "react";
import { createRoot } from "react-dom/client";
import { SidePanel, SidePanelContent, SidePanelHeader, SidePanelTitle, SidePanelBody, SidePanelFooter } from "../../../../src/components/side-panel";
import { Drawer, DrawerContent, DrawerTitle } from "../../../../src/components/drawer";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../../../../src/components/dialog";
function Example() {
  const [kind, setKind] = React.useState("");
  const fields = <>{Array.from({length:20}, (_,i) => <label key={i} className="block mb-4">{i === 0 ? "Company name" : `Field ${i+1}`}<input aria-label={i === 0 ? "Company name" : `Field ${i+1}`} autoFocus={i===19} className="block w-full border rounded-md h-11 px-3" /></label>)}</>;
  return <main className="p-6"><h1>Shared sheet behavior</h1><p>Component fixture — no production records.</p>{["Panel", "Drawer", "Dialog"].map(name => <button key={name} className="m-2 border rounded-md px-4 h-11" onClick={() => setKind(name)}>{name}</button>)}
    <SidePanel open={kind === "Panel"} onOpenChange={open => !open && setKind("")}><SidePanelContent><SidePanelHeader><SidePanelTitle>Add a company</SidePanelTitle></SidePanelHeader><SidePanelBody>{fields}</SidePanelBody><SidePanelFooter><button onClick={() => setKind("")}>Cancel</button><button>Create company</button></SidePanelFooter></SidePanelContent></SidePanel>
    <Drawer open={kind === "Drawer"} onOpenChange={open => !open && setKind("")}><DrawerContent><DrawerTitle>Choose company</DrawerTitle>{fields}<button onClick={() => setKind("")}>Cancel</button></DrawerContent></Drawer>
    <Dialog open={kind === "Dialog"} onOpenChange={open => !open && setKind("")}><DialogContent><DialogTitle>Edit company</DialogTitle><DialogDescription>Company details</DialogDescription>{fields}</DialogContent></Dialog>
  </main>;
}
createRoot(document.getElementById("root")!).render(<Example />);
