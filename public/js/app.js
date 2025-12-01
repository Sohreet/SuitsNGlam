console.log("APP.JS LOADED");

/* CONFIG */
const ADMINS=["sohabrar10@gmail.com"];
const GOOGLE_CLIENT_ID="653374521156-6retcia1fiu5dvmbjik9sq89ontrkmvt.apps.googleusercontent.com";
const DEFAULTS={userPicture:"/images/default-user.png",productImage:"/images/default-product.png",currencySymbol:"₹"};

/* SHORTCUTS */
const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const byId=id=>document.getElementById(id);
const escapeHtml=s=>String(s||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
const safeJSON={parse:(v,f)=>{try{return JSON.parse(v)||f;}catch{return f;}},str:v=>{try{return JSON.stringify(v);}catch{return null;}}};

/* USER STORAGE */
function getUser(){return safeJSON.parse(localStorage.getItem("sg_user"),null);}
function saveUser(u){if(u?.email)localStorage.setItem("sg_user",safeJSON.str(u));}
function clearUser(){localStorage.removeItem("sg_user");localStorage.removeItem("adminLoggedIn");}

/* LOGIN UI */
function setupLoginUI(){
  const u=getUser(),btn=byId("loginBtn"),ic=byId("accountIcon"),ad=byId("adminBadgeNav");
  if(!btn||!ic)return;
  if(!u){btn.style.display="inline-block";ic.style.display="none";if(ad)ad.style.display="none";return;}
  btn.style.display="none";ic.src=u.picture||DEFAULTS.userPicture;ic.style.display="inline-block";
  if(ADMINS.includes(u.email)){ad&& (ad.style.display="inline-block");ic.onclick=()=>location.href="admin.html";}
  else{ad&&(ad.style.display="none");ic.onclick=()=>location.href="account.html";}
}
function attachLoginButton(){const b=byId("loginBtn");if(b)b.onclick=()=>location.href="login.html";}
window.logout=()=>{clearUser();setupLoginUI();updateCartBadge();location.href="index.html";};

/* GOOGLE LOGIN */
async function waitGoogle(ms=8000){const t=Date.now();while(Date.now()-t<ms){if(window.google?.accounts?.id)return true;await new Promise(r=>setTimeout(r,100));}return false;}
async function initGoogleLogin(){if(!(await waitGoogle()))return false;if(!window.__g_init){google.accounts.id.initialize({client_id:GOOGLE_CLIENT_ID,callback:handleCredentialResponse,ux_mode:"popup"});google.accounts.id.disableAutoSelect?.();window.__g_init=true;}return true;}
window.handleCredentialResponse=r=>{if(!r?.credential)return alert("Google login failed");const d=jwt_decode(r.credential);const u={email:d.email,name:d.name||d.given_name||d.email,picture:d.picture||DEFAULTS.userPicture,token:r.credential};saveUser(u);ADMINS.includes(u.email)?localStorage.setItem("adminLoggedIn","true"):localStorage.removeItem("adminLoggedIn");setupLoginUI();updateCartBadge();location.reload();};

/* CART */
const getCart=()=>safeJSON.parse(localStorage.getItem("cart"),[]);
function saveCart(c){localStorage.setItem("cart",safeJSON.str(c||[]));}
function updateCartBadge(){const b=byId("cartCount");if(!b)return;const c=getCart();b.textContent=c.length?c.length:"";b.setAttribute("aria-label",c.length+" items");}
function addToCart(p,m=1){if(!p?._id)return alert("Error");const c=getCart();c.push({id:p._id,name:p.name||"Product",price:+p.price||0,image:p.images?.[0]||DEFAULTS.productImage,metres:+m||1});saveCart(c);updateCartBadge();alert("Added to cart!");}
window.addToCart=addToCart;
window.removeItem=i=>{const c=getCart();c.splice(i,1);saveCart(c);loadCartPage();};

function loadCartPage(){
  const list=byId("cartItems"),empty=byId("cartEmpty"),sum=byId("cartSummary"),t=byId("cartTotal");
  if(!list)return;const c=getCart();
  if(!c.length){empty&&(empty.style.display="block");list.innerHTML="";sum&&(sum.style.display="none");t&&(t.textContent=0);updateCartBadge();return;}
  empty&&(empty.style.display="none");sum&&(sum.style.display="block");
  let tot=0;list.innerHTML=c.map((v,i)=>{const lt=v.price*v.metres;tot+=lt;
    return `<div class="col-md-4 mb-3"><div class="card p-2 shadow-sm h-100">
      <img src="${escapeHtml(v.image)}" style="height:150px;width:100%;object-fit:cover;">
      <div class="card-body d-flex flex-column">
        <h5>${escapeHtml(v.name)}</h5>
        <p>${DEFAULTS.currencySymbol}${v.price} × ${v.metres} = ${DEFAULTS.currencySymbol}${lt}</p>
        <div class="mt-auto"><button class="btn btn-danger btn-sm" onclick="removeItem(${i})">Remove</button></div>
      </div></div></div>`;
  }).join("");t&&(t.textContent=tot);updateCartBadge();
}
window.loadCartPage=loadCartPage;

/* PRODUCTS */
async function fetchJSON(u,o={}){const r=await fetch(u,o);if(!r.ok)throw Error(r.status);return await r.json();}
window.openProduct=id=>location.href=`product.html?id=${id}`;
async function loadProducts(cat="all",id="productsContainer"){
  const box=byId(id);box&&(box.innerHTML="Loading...");
  try{
    const a=await fetchJSON(`/api/products/category/${encodeURIComponent(cat)}`);
    if(!a.length)return box&&(box.innerHTML="<p class='text-muted fw-bold'>Coming Soon...</p>");
    box.innerHTML=a.map(p=>`
      <div class="col-md-4 product-card">
        <div class="card shadow-sm" onclick="openProduct('${escapeHtml(p._id)}')" style="cursor:pointer;">
        <img src="${escapeHtml(p.images?.[0]||DEFAULTS.productImage)}" style="height:250px;width:100%;object-fit:cover;">
        <div class="card-body"><h5>${escapeHtml(p.name)}</h5><p class="fw-bold">${DEFAULTS.currencySymbol}${escapeHtml(p.price)}</p></div>
      </div></div>`).join("");
  }catch{box&&(box.innerHTML="<p class='text-muted'>Error loading products.</p>");}
}
window.loadProducts=loadProducts;

async function loadSingleProduct(){
  const id=new URLSearchParams(location.search).get("id");if(!id)return;
  try{
    const p=await fetchJSON(`/api/products/${encodeURIComponent(id)}`);window.currentProduct=p;
    byId("p_name")&&(byId("p_name").textContent=p.name);
    byId("p_price")&&(byId("p_price").textContent=p.price);
    byId("p_desc")&&(byId("p_desc").textContent=p.description);
    byId("p_category")&&(byId("p_category").textContent=p.category);
    const m=byId("mainImage");m&&(m.src=p.images?.[0]||DEFAULTS.productImage);
    const tr=byId("thumbRow");if(tr){tr.innerHTML=p.images?.map((img,i)=>`<img src="${escapeHtml(img)}" class="thumb-img ${i==0?'active':''}" style="height:60px;width:60px;object-fit:cover;margin-right:8px;cursor:pointer;" onclick="document.getElementById('mainImage').src='${escapeHtml(img)}'">`).join("");}
  }catch{}
}
window.loadSingleProduct=loadSingleProduct;
window.addToCartPage=()=>addToCart(window.currentProduct,byId("metreInput")?.value||1);

/* ADMIN */
window.adminDeleteProduct=async id=>{if(!confirm("Delete permanently?"))return;try{const r=await fetchJSON(`/api/admin/products/${id}`,{method:"DELETE"});r.success?(alert("Deleted"),renderAdminProducts()):alert("Failed");}catch{alert("Server error");}};
async function renderAdminProducts(){
  const o=byId("productsAdminList");if(!o)return;o.innerHTML="Loading...";
  try{
    const a=await fetchJSON("/api/products/category/all");
    o.innerHTML=a.map(p=>`
      <div class="card p-2 mb-2"><div class="d-flex align-items-center">
      <img src="${escapeHtml(p.images?.[0]||DEFAULTS.productImage)}" style="width:70px;height:70px;border-radius:8px;object-fit:cover;">
      <div class="ms-3"><strong>${escapeHtml(p.name)}</strong> — ${DEFAULTS.currencySymbol}${escapeHtml(p.price)}<br>${escapeHtml(p.category)}</div>
      <button class="btn btn-danger btn-sm ms-auto" onclick="adminDeleteProduct('${escapeHtml(p._id)}')">Delete</button>
      </div></div>`).join("");
  }catch{o.innerHTML="<p class='text-muted'>Failed.</p>";}
}
window.renderAdminProducts=renderAdminProducts;

/* EMAIL LOGIN */
window.emailLogin=async()=>{
  const e=byId("loginEmail")?.value.trim(),p=byId("loginPass")?.value;if(!e||!p)return alert("Enter credentials");
  const r=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:e,password:p})}).then(r=>r.json());
  if(!r.success)return alert(r.message||"Failed");
  saveUser(r.user);ADMINS.includes(r.user.email)?localStorage.setItem("adminLoggedIn","true"):localStorage.removeItem("adminLoggedIn");
  location.reload();
};
window.emailRegister=async()=>{
  const n=byId("regName")?.value.trim(),e=byId("regEmail")?.value.trim(),p=byId("regPass")?.value;if(!e||!p)return alert("Enter details");
  const r=await fetch("/api/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:n,email:e,password:p})}).then(r=>r.json());
  if(!r.success)return alert(r.message||"Failed");alert("Registered");location.href="login.html";
};
window.openRegister=()=>location.href="register.html";

/* ORDER HISTORY */
async function loadOrderHistory(){
  const u=getUser(),box=byId("ordersList");if(!box)return;
  if(!u)return box.innerHTML=`<p class="text-danger mt-3">Please login to see your orders.</p>`;
  try{
    const a=await fetch(`/api/orders/${u.email}`).then(r=>r.json());
    if(!a.length)return box.innerHTML=`
      <div class="text-center mt-5">
        <img src="https://cdn-icons-png.flaticon.com/512/4076/4076500.png" width="120" class="opacity-75 mb-3">
        <h5 class="fw-bold text-secondary">No Orders Yet</h5>
        <p class="text-muted">You haven't purchased anything.</p>
        <a href="allproducts.html" class="btn btn-primary mt-2">Start Shopping</a>
      </div>`;
    box.innerHTML=a.map(o=>`
      <div class="card p-3 mb-3">
        <h5>Order #${o._id}</h5>
        <p><b>Date:</b> ${new Date(o.date).toLocaleString()}</p>
        <p><b>Total:</b> ₹${o.total}</p>
        <hr><h6>Items:</h6>
        ${o.items.map(i=>`<p>• ${i.name} (x${i.quantity})</p>`).join("")}
      </div>`).join("");
  }catch{box.innerHTML="<p>Error loading orders.</p>";}
}
window.loadOrderHistory=loadOrderHistory;

/* INIT */
document.addEventListener("DOMContentLoaded",async()=>{
  setupLoginUI();
  updateCartBadge();
  attachLoginButton();
  initGoogleLogin();

  const p=location.pathname.toLowerCase();
  if(p.includes("cart"))loadCartPage();
  if(p.includes("product"))loadSingleProduct();
  if(p.includes("admin"))renderAdminProducts();
  if(p.includes("orderhistory"))loadOrderHistory();

  qsa("[data-products-cat]").forEach(el=>loadProducts(el.getAttribute("data-products-cat")||"all",el.id));
});
