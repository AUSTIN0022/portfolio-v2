/**
 * Autoscale: an auto-scaling group. A load balancer stands at the head of a
 * plinth with eight server slots; a dashed feed runs from it along the slots.
 * The pointer's height is incoming traffic: as it rises, instances boot up out
 * of the plinth one by one, and their status lines light once they lock into
 * place; as it falls they sink back flush. At rest two instances are live.
 * The slider is the boot stagger, in ms.
 *
 * The pattern: discrete items on tweens, staggered outwards from the edge of
 * the change. The count is read from the pointer's fixed screen height, never
 * from anything drawn, so a rising instance cannot change the choice.
 */
const { Cam, clamp, facing, fit, lerp, open, poly, prism, proj, rings, ringAt, seg, tdone, tset, tval, tween, disposer, mk, solid, put, place, flatDot, pointer, register } = HL;

const N = 8, W = 20, D = 22, PITCH = 25, H = 40, Z0 = 8, REST = 2;
const PX0 = -44, PX1 = (N - 1) * PITCH + W + 6, PY0 = -10, PY1 = D + 11;
const LB = [-38, -6, -12, D + 7], LBH = 15, BUS = D + 4;

function mount({ stage, svg, read }, value) {
  const bag = disposer();
  let step = value;

  const C = Cam(45, 0.5, 1.46);
  fit(C, [[PX0, PY0, 0], [PX1, PY1, 0], [PX1, PY0, 0], [PX0, PY1, 0], [PX0, PY0, Z0 + LBH], [PX1, PY0, Z0 + H], [PX0, PY1, -4]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // the plinth, the dashed feed from the balancer along the slots, and each slot's well and standby dot
  const [pr, pi] = rings(PX0, PY0, PX1, PY1, 7, 1.8);
  put(solid(g), prism(P, front, pr, pi, 0, Z0));
  mk("path", { d: open([P(LB[2], BUS, Z0), P((N - 1) * PITCH + W, BUS, Z0)]), class: "nf lo dash" }, g);
  const slots = [];
  for (let i = 0; i < N; i++) {
    const x0 = i * PITCH, [ring, inner] = rings(x0, 0, x0 + W, D, 3.5, 1.4);
    mk("path", { d: poly(ringAt(P, ring, Z0)), class: "nf lo" }, g);
    mk("path", { d: seg(P(x0 + W / 2, BUS, Z0), P(x0 + W / 2, D + 1, Z0)), class: "nf lo dash" }, g);
    const dot = flatDot(g, C, 1.3, "dot off");
    place(dot, P(x0 + W / 2, D / 2, Z0));
    slots.push({ x0, ring, inner, dot, h: tween(i < REST ? H : 0), drawn: NaN, live: i < REST });
  }

  // the load balancer: lower and deeper than a server, ports along its front, a listener slot on top
  const [lr, li] = rings(LB[0], LB[1], LB[2], LB[3], 4, 1.6), lt = Z0 + LBH;
  put(solid(g), prism(P, front, lr, li, Z0, lt));
  const lp = [];
  for (let k = 0; k < 4; k++) { const x = LB[0] + 5 + k * 5.4; lp.push(seg(P(x, LB[3], lt - 5), P(x + 3, LB[3], lt - 5))); }
  lp.push(seg(P(LB[0] + 4, LB[3], lt - 10), P(LB[2] - 4, LB[3], lt - 10)));
  mk("path", { d: lp.join(""), class: "nf lo" }, g);
  mk("path", { d: open([P(LB[0] + 6, LB[1] + 8, lt), P(LB[0] + 6, LB[3] - 8, lt)]), class: "nf lo" }, g);

  // the servers, far to near: a body, its drive slots and vent, and a status line
  for (const s of slots) {
    s.el = solid(g);
    s.bays = mk("path", { class: "nf lo" }, s.el.g);
    s.led = mk("path", { class: "nf" }, s.el.g);
  }

  /** Draws server s at height h above the plinth: the body, then the marks that have cleared the plinth's top. */
  function draw(s, h) {
    if (h === s.drawn) return;
    s.drawn = h;
    const up = h > 0.6, zt = Z0 + h, x0 = s.x0, x1 = x0 + W;
    put(s.el, up ? prism(P, front, s.ring, s.inner, Z0, zt) : { sil: "", crease: "" });
    const at = (x, z) => P(x, D, z), on = (z) => z > Z0 + 1.2;
    let b = "";
    for (const z of [zt - 12, zt - 17]) if (on(z)) b += seg(at(x0 + 4, z), at(x1 - 9, z));
    for (let k = 0; k < 3; k++) { const x = x1 - 6 + k * 1.6, z = zt - 12; if (on(z - 6)) b += seg(at(x, z), at(x, z - 6)); }
    for (const z of [zt - 26, zt - 31]) if (on(z)) b += seg(at(x0 + 4, z), at(x1 - 4, z));
    s.bays.setAttribute("d", b);
    s.led.setAttribute("d", on(zt - 5) ? seg(at(x0 + 4, zt - 5), at(x1 - 4, zt - 5)) : "");
  }

  /** A server's status line lights only once it has locked into place. */
  function mark(s, now) {
    const lit = s.live && tdone(s.h, now);
    s.led.classList.toggle("hi", lit);
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const s of slots) { draw(s, tval(s.h, now)); mark(s, now); if (!tdone(s.h, now)) moving = true; }
    return moving;
  });
  bag.add(B.unregister);

  let count = REST;
  /** Scales to n instances. New ones boot outwards from the last live one; leaving ones sink from the far end in. */
  function scale(n) {
    if (n === count) return;
    const now = performance.now(), from = n > count ? count : count - 1;
    count = n;
    slots.forEach((s, i) => {
      s.live = i < n;
      tset(s.h, s.live ? H : 0, now, Math.abs(i - from) * step);
    });
    B.wake();
  }

  // traffic is the pointer's height on the stage: a fixed band of the viewBox, nothing drawn
  const traffic = (sy) => lerp(0.03, 0.78, clamp((262 - sy) / 196, 0, 1));
  function move([, sy]) {
    const u = traffic(sy), n = clamp(Math.ceil((u * N) / 0.8), 1, N);
    scale(n);
    read.textContent = "instances " + String(n).padStart(2, "0") + " · load " + Math.round((u * N * 100) / n) + "%";
  }
  function leave() { scale(REST); read.textContent = "rest"; }

  read.textContent = "rest";
  bag.add(pointer(stage, { move, leave }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { step = v; },
    destroy: bag.dispose,
  };
}

hairline({
  name: "autoscale",
  means: "An auto-scaling group: raise the pointer to raise traffic, and servers boot up out of the plinth one by one.",
  rules: [1, 2, 4, 5, 8],
  range: [20, 50, 90],
  tour: [[200, 250], [200, 160], [200, 70], null],
  mount,
});
