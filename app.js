/***********************
  SUPPORTED WIDTH BUCKETS
************************/
const SUPPORTED = [1400,1500,1800,2100,2400,2700,3000,3600];

/***********************
  UPDATED CUTLIST RULES
************************/
const CONFIGS = {
  1400: { half:2, full:0, plain:1, adj:2, fixed:1, drawers:1, rails:2, sheets:1 },
  1500: { half:2, full:0, plain:1, adj:2, fixed:1, drawers:1, rails:2, sheets:1 },
  1800: { half:2, full:1, plain:1, adj:5, fixed:2, drawers:1, rails:2, sheets:2 },
  2100: { half:2, full:1, plain:1, adj:5, fixed:2, drawers:1, rails:2, sheets:2 },
  2400: { half:2, full:1, plain:2, adj:5, fixed:2, drawers:1, rails:4, sheets:2 },
  2700: { half:2, full:1, plain:2, adj:5, fixed:2, drawers:1, rails:4, sheets:2 },
  3000: { half:2, full:1, plain:3, adj:5, fixed:2, drawers:1, rails:4, sheets:2 },
  3600: { half:4, full:1, plain:3, adj:8, fixed:3, drawers:1, rails:4, sheets:3 }
};

let lastCutlist = [];

/***********************
  WIDTH BUCKET MATCHING
************************/
function bucketMatch(w){
  const mids=[];
  for(let i=0;i<SUPPORTED.length-1;i++){
    mids.push((SUPPORTED[i]+SUPPORTED[i+1])/2);
  }
  if(w<mids[0]) return SUPPORTED[0];
  for(let i=1;i<mids.length;i++){
    if(w>=mids[i-1] && w<mids[i]) return SUPPORTED[i];
  }
  return SUPPORTED[SUPPORTED.length-1];
}

/***********************
  ADD ITEM
************************/
function addItem(list,name,qty,h,w,d,notes=""){
  if(qty<=0) return;
  list.push({
    PartName:name,
    Qty:qty,
    Height_mm:h,
    Width_mm:w,
    Depth_mm:d,
    Notes:notes
  });
}

/***********************
  MAIN GENERATE FUNCTION
************************/
function generate(){
  const roomWidth = parseInt(document.getElementById("roomWidth").value);
  const wallBoth = document.getElementById("wallBoth").value==="yes";
  const info = document.getElementById("matchInfo");
  const dlBtn = document.getElementById("dlBtn");

  if(!roomWidth || roomWidth<=0){
    alert("Please enter valid room width");
    return;
  }

  const matched = bucketMatch(roomWidth);
  info.textContent = `Input width: ${roomWidth} mm | Matched bucket used: ${matched} mm`;

  const cfg = CONFIGS[matched];
  const list = [];

  /* Panels */
  addItem(list,"Half Drill Panel",cfg.half,1950,447,0);
  addItem(list,"Full Drill Panel",cfg.full,1950,447,0);
  addItem(list,"Plain Panel",cfg.plain,1950,447,0);

  /* Shelves */
  addItem(list,"Adjustable Shelf",cfg.adj,0,460,430);
  addItem(list,"Fixed Shelf",cfg.fixed,0,463,430);

  /* Drawer */
  addItem(list,"Drawer Set",cfg.drawers,0,460,0,"3 drawers");

  /* Hanging Rails */
  if(cfg.rails===2){
    addItem(list,"Hanging Rail",1,0,matched,0,"Top");
    addItem(list,"Hanging Rail",1,0,matched,0,"Bottom");
  } else {
    addItem(list,"Hanging Rail",2,0,matched,0,"Top (x2)");
    addItem(list,"Hanging Rail",2,0,matched,0,"Bottom (x2)");
  }

  /* Sheets */
  addItem(list,"Sheet 1800x2400",cfg.sheets,2400,1800,0);

  /* Wall on both sides panels */
  if(wallBoth){
    addItem(list,"Wall Side Panel - Fixed",1,2400,600,600);
    if(roomWidth!==2400){
      addItem(list,"Wall Side Panel - Variable",1,2400,Math.abs(roomWidth-2400),600);
    }
  }

  /* 16mm x 80mm strip panel (2380 split) */
  const LIMIT=2380;
  if(roomWidth<=LIMIT){
    addItem(list,"Strip Panel 16mm x 80mm",1,16,roomWidth,80);
  } else {
    addItem(list,"Strip Panel 16mm x 80mm",1,16,LIMIT,80,"Base 2380");
    addItem(list,"Strip Panel 16mm x 80mm",1,16,roomWidth-LIMIT,80,"Exceeded");
  }

  lastCutlist=list;
  renderTable(list);
  dlBtn.disabled=false;
}

/***********************
  RENDER TABLE
************************/
function renderTable(list){
  let html="<table><tr><th>Part</th><th>Qty</th><th>H</th><th>W</th><th>D</th><th>Notes</th></tr>";
  list.forEach(r=>{
    html+=`<tr>
      <td>${r.PartName}</td>
      <td>${r.Qty}</td>
      <td>${r.Height_mm}</td>
      <td>${r.Width_mm}</td>
      <td>${r.Depth_mm}</td>
      <td>${r.Notes||""}</td>
    </tr>`;
  });
  html+="</table>";
  document.getElementById("tableWrap").innerHTML=html;
}

/***********************
  CSV DOWNLOAD
************************/
function downloadCSV(){
  if(!lastCutlist.length) return;
  const headers=["PartName","Qty","Height_mm","Width_mm","Depth_mm","Notes"];
  let rows=[headers.join(",")];
  lastCutlist.forEach(r=>{
    rows.push(headers.map(h=>`"${r[h]||""}"`).join(","));
  });
  const blob=new Blob([rows.join("\n")],{type:"text/csv"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="cutlist.csv";
  a.click();
}
