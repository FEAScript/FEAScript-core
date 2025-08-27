// Constants
const nemax = 1600;
const nnmax = 6724;
const nmax = 2000;

// Common block equivalents as objects
const block1 = {
  nex: 0,
  ney: 0,
  nnx: 0,
  nny: 0,
  ne: 0,
  np: 0,
  xorigin: 0,
  yorigin: 0,
  xlast: 0,
  ylast: 0,
  deltax: 0,
  deltay: 0,
  nop: Array(nemax)
    .fill()
    .map(() => Array(9).fill(0)),
  xpt: Array(nnmax).fill(0),
  ypt: Array(nnmax).fill(0),
  ncod: Array(nnmax).fill(0),
  bc: Array(nnmax).fill(0),
  r1: Array(nnmax).fill(0),
  u: Array(nnmax).fill(0),
  ntop: Array(nemax).fill(0),
  nlat: Array(nemax).fill(0),
};

const gauss = {
  w: [0.27777777777778, 0.444444444444, 0.27777777777778],
  gp: [0.1127016654, 0.5, 0.8872983346],
};

const fro1 = {
  iwr1: 0,
  npt: 0,
  ntra: 0,
  nbn: Array(nemax).fill(0),
  det: 1,
  sk: Array(nmax * nmax).fill(0),
  ice1: 0,
};

const fabf1 = {
  estifm: Array(9)
    .fill()
    .map(() => Array(9).fill(0)),
  nell: 0,
};

const fb1 = {
  ecv: Array(2000000).fill(0),
  lhed: Array(nmax).fill(0),
  qq: Array(nmax).fill(0),
  ecpiv: Array(2000000).fill(0),
};

// Main program logic
function main() {
  console.log("2-D problem. Biquadratic basis functions\n");
  xydiscr();
  nodnumb();
  xycoord();
  console.log(`nex=${block1.nex}  ney=${block1.ney}  ne=${block1.ne}  np=${block1.np}\n`);

  // Prepare essential boundary conditions
  for (let i = 0; i < block1.np; i++) {
    block1.ncod[i] = 0;
    block1.bc[i] = 0;
  }

  for (let i = 0; i < block1.nny; i++) {
    block1.ncod[i] = 1;
    block1.bc[i] = 0;
  }

  for (let i = 0; i < block1.np; i += block1.nny) {
    block1.ncod[i] = 1;
    block1.bc[i] = 0;
  }

  // Prepare natural boundary conditions
  for (let i = 0; i < block1.ne; i++) {
    block1.ntop[i] = 0;
    block1.nlat[i] = 0;
  }

  for (let i = block1.ney - 1; i < block1.ne; i += block1.ney) {
    block1.ntop[i] = 1;
  }

  for (let i = block1.ne - block1.ney; i < block1.ne; i++) {
    block1.nlat[i] = 1;
  }

  // Initialization
  for (let i = 0; i < block1.np; i++) {
    block1.r1[i] = 0;
  }

  fro1.npt = block1.np;
  fro1.iwr1 = 0;
  fro1.ntra = 1;
  fro1.det = 1;

  for (let i = 0; i < block1.ne; i++) {
    fro1.nbn[i] = 9;
  }

  front();

  // Copy solution
  for (let i = 0; i < block1.np; i++) {
    block1.u[i] = fro1.sk[i];
  }

  // Output results to console
  for (let i = 0; i < block1.np; i++) {
    console.log(
      `${block1.xpt[i].toExponential(5)}  ${block1.ypt[i].toExponential(5)}  ${block1.u[i].toExponential(5)}`
    );
  }
}

// Discretization
function xydiscr() {
  block1.nex = 12;
  block1.ney = 8;
  block1.xorigin = 0;
  block1.yorigin = 0;
  block1.xlast = 1;
  block1.ylast = 1;
  block1.deltax = (block1.xlast - block1.xorigin) / block1.nex;
  block1.deltay = (block1.ylast - block1.yorigin) / block1.ney;
}

// Nodal numbering
function nodnumb() {
  block1.ne = block1.nex * block1.ney;
  block1.nnx = 2 * block1.nex + 1;
  block1.nny = 2 * block1.ney + 1;
  block1.np = block1.nnx * block1.nny;

  let nel = 0;
  for (let i = 1; i <= block1.nex; i++) {
    for (let j = 1; j <= block1.ney; j++) {
      nel++;
      for (let k = 1; k <= 3; k++) {
        let l = 3 * k - 2;
        block1.nop[nel - 1][l - 1] = block1.nny * (2 * i + k - 3) + 2 * j - 1;
        block1.nop[nel - 1][l] = block1.nop[nel - 1][l - 1] + 1;
        block1.nop[nel - 1][l + 1] = block1.nop[nel - 1][l - 1] + 2;
      }
    }
  }
}

// Coordinate setup
function xycoord() {
  block1.xpt[0] = block1.xorigin;
  block1.ypt[0] = block1.yorigin;

  for (let i = 1; i <= block1.nnx; i++) {
    let nnode = (i - 1) * block1.nny;
    block1.xpt[nnode] = block1.xpt[0] + ((i - 1) * block1.deltax) / 2;
    block1.ypt[nnode] = block1.ypt[0];

    for (let j = 2; j <= block1.nny; j++) {
      block1.xpt[nnode + j - 1] = block1.xpt[nnode];
      block1.ypt[nnode + j - 1] = block1.ypt[nnode] + ((j - 1) * block1.deltay) / 2;
    }
  }
}

// Basis functions
function tsfun(x, y) {
  const tsfn = {
    phi: Array(9).fill(0),
    phic: Array(9).fill(0),
    phie: Array(9).fill(0),
  };

  const l1 = (c) => 2 * c * c - 3 * c + 1;
  const l2 = (c) => -4 * c * c + 4 * c;
  const l3 = (c) => 2 * c * c - c;
  const dl1 = (c) => 4 * c - 3;
  const dl2 = (c) => -8 * c + 4;
  const dl3 = (c) => 4 * c - 1;

  tsfn.phi[0] = l1(x) * l1(y);
  tsfn.phi[1] = l1(x) * l2(y);
  tsfn.phi[2] = l1(x) * l3(y);
  tsfn.phi[3] = l2(x) * l1(y);
  tsfn.phi[4] = l2(x) * l2(y);
  tsfn.phi[5] = l2(x) * l3(y);
  tsfn.phi[6] = l3(x) * l1(y);
  tsfn.phi[7] = l3(x) * l2(y);
  tsfn.phi[8] = l3(x) * l3(y);

  tsfn.phic[0] = l1(y) * dl1(x);
  tsfn.phic[1] = l2(y) * dl1(x);
  tsfn.phic[2] = l3(y) * dl1(x);
  tsfn.phic[3] = l1(y) * dl2(x);
  tsfn.phic[4] = l2(y) * dl2(x);
  tsfn.phic[5] = l3(y) * dl2(x);
  tsfn.phic[6] = l1(y) * dl3(x);
  tsfn.phic[7] = l2(y) * dl3(x);
  tsfn.phic[8] = l3(y) * dl3(x);

  tsfn.phie[0] = l1(x) * dl1(y);
  tsfn.phie[1] = l1(x) * dl2(y);
  tsfn.phie[2] = l1(x) * dl3(y);
  tsfn.phie[3] = l2(x) * dl1(y);
  tsfn.phie[4] = l2(x) * dl2(y);
  tsfn.phie[5] = l2(x) * dl3(y);
  tsfn.phie[6] = l3(x) * dl1(y);
  tsfn.phie[7] = l3(x) * dl2(y);
  tsfn.phie[8] = l3(x) * dl3(y);

  return tsfn;
}

// Element stiffness matrix and residuals
function abfind() {
  let ngl = Array(9).fill(0);
  let tphx = Array(9).fill(0);
  let tphy = Array(9).fill(0);

  // Initialize stiffness matrix
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      fabf1.estifm[i][j] = 0;
    }
  }

  for (let i = 0; i < 9; i++) {
    ngl[i] = Math.abs(block1.nop[fabf1.nell - 1][i]);
  }

  for (let j = 0; j < 3; j++) {
    for (let k = 0; k < 3; k++) {
      let ts = tsfun(gauss.gp[j], gauss.gp[k]);
      let x1 = 0,
        x2 = 0,
        y1 = 0,
        y2 = 0;

      for (let n = 0; n < 9; n++) {
        x1 += block1.xpt[ngl[n] - 1] * ts.phic[n];
        x2 += block1.xpt[ngl[n] - 1] * ts.phie[n];
        y1 += block1.ypt[ngl[n] - 1] * ts.phic[n];
        y2 += block1.ypt[ngl[n] - 1] * ts.phie[n];
      }

      let dett = x1 * y2 - x2 * y1;

      for (let i = 0; i < 9; i++) {
        tphx[i] = (y2 * ts.phic[i] - y1 * ts.phie[i]) / dett;
        tphy[i] = (x1 * ts.phie[i] - x2 * ts.phic[i]) / dett;
      }

      for (let l = 0; l < 9; l++) {
        for (let m = 0; m < 9; m++) {
          fabf1.estifm[l][m] -= gauss.w[j] * gauss.w[k] * dett * (tphx[l] * tphx[m] + tphy[l] * tphy[m]);
        }
      }
    }
  }

  if (block1.ntop[fabf1.nell - 1] !== 1 && block1.nlat[fabf1.nell - 1] !== 1) return;

  if (block1.ntop[fabf1.nell - 1] === 1) {
    for (let k1 = 0; k1 < 3; k1++) {
      let ts = tsfun(gauss.gp[k1], 1);
      let x = 0,
        x1 = 0;

      for (let n = 0; n < 9; n++) {
        x += block1.xpt[ngl[n] - 1] * ts.phi[n];
        x1 += block1.xpt[ngl[n] - 1] * ts.phic[n];
      }

      for (let k11 of [2, 5, 8]) {
        block1.r1[ngl[k11] - 1] -= gauss.w[k1] * x1 * ts.phi[k11] * x;
      }
    }
  }

  if (block1.nlat[fabf1.nell - 1] === 1) {
    for (let k2 = 0; k2 < 3; k2++) {
      let ts = tsfun(1, gauss.gp[k2]);
      let y = 0,
        y2 = 0;

      for (let n = 0; n < 9; n++) {
        y += block1.ypt[ngl[n] - 1] * ts.phi[n];
        y2 += block1.ypt[ngl[n] - 1] * ts.phie[n];
      }

      for (let k21 of [6, 7, 8]) {
        block1.r1[ngl[k21] - 1] -= gauss.w[k2] * y2 * ts.phi[k21] * y;
      }
    }
  }
}

// Frontal solver
function front() {
  let ldest = Array(9).fill(0);
  let kdest = Array(9).fill(0);
  let khed = Array(nmax).fill(0);
  let kpiv = Array(nmax).fill(0);
  let lpiv = Array(nmax).fill(0);
  let jmod = Array(nmax).fill(0);
  let pvkol = Array(nmax).fill(0);
  let eq = Array(nmax)
    .fill()
    .map(() => Array(nmax).fill(0));
  let nrs = Array(nnmax).fill(0);
  let ncs = Array(nnmax).fill(0);
  let check = Array(nnmax).fill(0);
  let lco; // Declare lco once at function scope

  let ice = 1;
  fro1.iwr1++;
  let ipiv = 1;
  let nsum = 1;
  fabf1.nell = 0;

  for (let i = 0; i < fro1.npt; i++) {
    nrs[i] = 0;
    ncs[i] = 0;
  }

  if (fro1.ntra !== 0) {
    // Prefront: find last appearance of each node
    for (let i = 0; i < fro1.npt; i++) {
      check[i] = 0;
    }

    for (let i = 0; i < block1.ne; i++) {
      let nep = block1.ne - i - 1;
      for (let j = 0; j < fro1.nbn[nep]; j++) {
        let k = block1.nop[nep][j];
        if (check[k - 1] === 0) {
          check[k - 1] = 1;
          block1.nop[nep][j] = -block1.nop[nep][j];
        }
      }
    }
  }

  fro1.ntra = 0;
  let lcol = 0;
  let krow = 0;

  for (let i = 0; i < nmax; i++) {
    for (let j = 0; j < nmax; j++) {
      eq[j][i] = 0;
    }
  }

  while (true) {
    fabf1.nell++;
    abfind();

    let n = fabf1.nell;
    let nend = fro1.nbn[n - 1];
    let lend = fro1.nbn[n - 1];

    for (let lk = 0; lk < lend; lk++) {
      let nodk = block1.nop[n - 1][lk];
      let ll;

      if (lcol === 0) {
        lcol++;
        ldest[lk] = lcol;
        fb1.lhed[lcol - 1] = nodk;
      } else {
        for (ll = 0; ll < lcol; ll++) {
          if (Math.abs(nodk) === Math.abs(fb1.lhed[ll])) break;
        }

        if (ll === lcol) {
          lcol++;
          ldest[lk] = lcol;
          fb1.lhed[lcol - 1] = nodk;
        } else {
          ldest[lk] = ll + 1;
          fb1.lhed[ll] = nodk;
        }
      }

      let kk;
      if (krow === 0) {
        krow++;
        kdest[lk] = krow;
        khed[krow - 1] = nodk;
      } else {
        for (kk = 0; kk < krow; kk++) {
          if (Math.abs(nodk) === Math.abs(khed[kk])) break;
        }

        if (kk === krow) {
          krow++;
          kdest[lk] = krow;
          khed[krow - 1] = nodk;
        } else {
          kdest[lk] = kk + 1;
          khed[kk] = nodk;
        }
      }
    }

    if (krow > nmax || lcol > nmax) {
      console.error("Error: nmax-nsum not large enough");
      return;
    }

    for (let l = 0; l < lend; l++) {
      let ll = ldest[l];
      for (let k = 0; k < nend; k++) {
        let kk = kdest[k];
        eq[kk - 1][ll - 1] += fabf1.estifm[k][l];
      }
    }

    let lc = 0;
    for (let l = 0; l < lcol; l++) {
      if (fb1.lhed[l] < 0) {
        lpiv[lc] = l + 1;
        lc++;
      }
    }

    let ir = 0;
    let kr = 0;
    for (let k = 0; k < krow; k++) {
      let kt = khed[k];
      if (kt < 0) {
        kpiv[kr] = k + 1;
        kr++;
        let kro = Math.abs(kt);
        if (block1.ncod[kro - 1] === 1) {
          jmod[ir] = k + 1;
          ir++;
          block1.ncod[kro - 1] = 2;
          block1.r1[kro - 1] = block1.bc[kro - 1];
        }
      }
    }

    if (ir > 0) {
      for (let irr = 0; irr < ir; irr++) {
        let k = jmod[irr] - 1;
        let kh = Math.abs(khed[k]);
        for (let l = 0; l < lcol; l++) {
          eq[k][l] = 0;
          let lh = Math.abs(fb1.lhed[l]);
          if (lh === kh) eq[k][l] = 1;
        }
      }
    }

    if (lc > nsum || fabf1.nell < block1.ne) {
      if (lc === 0) {
        console.error("Error: no more rows fully summed");
        return;
      }

      let kpivro = kpiv[0];
      let lpivco = lpiv[0];
      let pivot = eq[kpivro - 1][lpivco - 1];

      if (Math.abs(pivot) < 1e-4) {
        pivot = 0;
        for (let l = 0; l < lc; l++) {
          let lpivc = lpiv[l];
          for (let k = 0; k < kr; k++) {
            let kpivr = kpiv[k];
            let piva = eq[kpivr - 1][lpivc - 1];
            if (Math.abs(piva) > Math.abs(pivot)) {
              pivot = piva;
              lpivco = lpivc;
              kpivro = kpivr;
            }
          }
        }
      }

      let kro = Math.abs(khed[kpivro - 1]);
      lco = Math.abs(fb1.lhed[lpivco - 1]); // Assign, don't declare
      let nhlp = kro + lco + nrs[kro - 1] + ncs[lco - 1];
      fro1.det = (fro1.det * pivot * (-1) ** nhlp) / Math.abs(pivot);

      for (let iperm = 0; iperm < fro1.npt; iperm++) {
        if (iperm >= kro) nrs[iperm]--;
        if (iperm >= lco) ncs[iperm]--;
      }

      if (Math.abs(pivot) < 1e-10) {
        console.warn(
          `Warning: matrix singular or ill-conditioned, nell=${fabf1.nell}, kro=${kro}, lco=${lco}, pivot=${pivot}`
        );
      }

      if (pivot === 0) return;

      for (let l = 0; l < lcol; l++) {
        fb1.qq[l] = eq[kpivro - 1][l] / pivot;
      }

      let rhs = block1.r1[kro - 1] / pivot;
      block1.r1[kro - 1] = rhs;
      pvkol[kpivro - 1] = pivot;

      if (kpivro > 1) {
        for (let k = 0; k < kpivro - 1; k++) {
          let krw = Math.abs(khed[k]);
          let fac = eq[k][lpivco - 1];
          pvkol[k] = fac;
          if (lpivco > 1 && fac !== 0) {
            for (let l = 0; l < lpivco - 1; l++) {
              eq[k][l] -= fac * fb1.qq[l];
            }
          }
          if (lpivco < lcol) {
            for (let l = lpivco; l < lcol; l++) {
              eq[k][l - 1] = eq[k][l] - fac * fb1.qq[l];
            }
          }
          block1.r1[krw - 1] -= fac * rhs;
        }
      }

      if (kpivro < krow) {
        for (let k = kpivro; k < krow; k++) {
          let krw = Math.abs(khed[k]);
          let fac = eq[k][lpivco - 1];
          pvkol[k] = fac;
          if (lpivco > 1) {
            for (let l = 0; l < lpivco - 1; l++) {
              eq[k - 1][l] = eq[k][l] - fac * fb1.qq[l];
            }
          }
          if (lpivco < lcol) {
            for (let l = lpivco; l < lcol; l++) {
              eq[k - 1][l - 1] = eq[k][l] - fac * fb1.qq[l];
            }
          }
          block1.r1[krw - 1] -= fac * rhs;
        }
      }

      for (let i = 0; i < krow; i++) {
        fb1.ecpiv[ipiv + i - 1] = pvkol[i];
      }
      ipiv += krow;

      for (let i = 0; i < krow; i++) {
        fb1.ecpiv[ipiv + i - 1] = khed[i];
      }
      ipiv += krow;

      fb1.ecpiv[ipiv - 1] = kpivro;
      ipiv++;

      for (let i = 0; i < lcol; i++) {
        fb1.ecv[ice - 1 + i] = fb1.qq[i];
      }
      ice += lcol;

      for (let i = 0; i < lcol; i++) {
        fb1.ecv[ice - 1 + i] = fb1.lhed[i];
      }
      ice += lcol;

      fb1.ecv[ice - 1] = kro;
      fb1.ecv[ice] = lcol;
      fb1.ecv[ice + 1] = lpivco;
      fb1.ecv[ice + 2] = pivot;
      ice += 4;

      for (let k = 0; k < krow; k++) {
        eq[k][lcol - 1] = 0;
      }

      for (let l = 0; l < lcol; l++) {
        eq[krow - 1][l] = 0;
      }

      lcol--;
      if (lpivco < lcol + 1) {
        for (let l = lpivco - 1; l < lcol; l++) {
          fb1.lhed[l] = fb1.lhed[l + 1];
        }
      }

      krow--;
      if (kpivro < krow + 1) {
        for (let k = kpivro - 1; k < krow; k++) {
          khed[k] = khed[k + 1];
        }
      }

      if (krow > 1 || fabf1.nell < block1.ne) continue;

      lco = Math.abs(fb1.lhed[0]); // Assign, don't declare
      kpivro = 1;
      pivot = eq[0][0];
      kro = Math.abs(khed[0]);
      lpivco = 1;
      nhlp = kro + lco + nrs[kro - 1] + ncs[lco - 1];
      fro1.det = (fro1.det * pivot * (-1) ** nhlp) / Math.abs(pivot);

      fb1.qq[0] = 1;
      if (Math.abs(pivot) < 1e-10) {
        console.warn(
          `Warning: matrix singular or ill-conditioned, nell=${fabf1.nell}, kro=${kro}, lco=${lco}, pivot=${pivot}`
        );
      }

      if (pivot === 0) return;

      block1.r1[kro - 1] = block1.r1[kro - 1] / pivot;
      fb1.ecv[ice - 1] = fb1.qq[0];
      ice++;
      fb1.ecv[ice - 1] = fb1.lhed[0];
      ice++;
      fb1.ecv[ice - 1] = kro;
      fb1.ecv[ice] = lcol;
      fb1.ecv[ice + 1] = lpivco;
      fb1.ecv[ice + 2] = pivot;
      ice += 4;

      fb1.ecpiv[ipiv - 1] = pvkol[0];
      ipiv++;
      fb1.ecpiv[ipiv - 1] = khed[0];
      ipiv++;
      fb1.ecpiv[ipiv - 1] = kpivro;
      ipiv++;

      fro1.ice1 = ice;
      if (fro1.iwr1 === 1) console.log(`total ecs transfer in matrix reduction=${ice}`);

      bacsub(ice);
      break;
    }
  }
}

// Back substitution
function bacsub(ice) {
  for (let i = 0; i < fro1.npt; i++) {
    fro1.sk[i] = block1.bc[i];
  }

  for (let iv = 1; iv <= fro1.npt; iv++) {
    ice -= 4;
    let kro = fb1.ecv[ice - 1];
    let lcol = fb1.ecv[ice];
    let lpivco = fb1.ecv[ice + 1];
    let pivot = fb1.ecv[ice + 2];

    if (iv === 1) {
      ice--;
      fb1.lhed[0] = fb1.ecv[ice - 1];
      ice--;
      fb1.qq[0] = fb1.ecv[ice - 1];
    } else {
      ice -= lcol;
      for (let iii = 0; iii < lcol; iii++) {
        fb1.lhed[iii] = fb1.ecv[ice - 1 + iii];
      }
      ice -= lcol;
      for (let iii = 0; iii < lcol; iii++) {
        fb1.qq[iii] = fb1.ecv[ice - 1 + iii];
      }
    }

    let lco = Math.abs(fb1.lhed[lpivco - 1]);
    if (block1.ncod[lco - 1] > 0) continue;

    let gash = 0;
    fb1.qq[lpivco - 1] = 0;
    for (let l = 0; l < lcol; l++) {
      gash -= fb1.qq[l] * fro1.sk[Math.abs(fb1.lhed[l]) - 1];
    }

    fro1.sk[lco - 1] = gash + block1.r1[kro - 1];

    block1.ncod[lco - 1] = 1;
  }

  if (fro1.iwr1 === 1) console.log(`value of ice after backsubstitution=${ice}`);
}

// Run the program
main();
