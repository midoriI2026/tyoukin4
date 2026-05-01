(function() {
'use strict';

/********** ① DBTaskForm → 編集画面へ（同一タブ） **********/
if (location.href.includes("page=DBTaskForm")) {

    const btn = document.createElement("button");
    btn.textContent = "超勤フロー前チェック_休憩・項目整合";

    btn.style.position = "fixed";
    btn.style.top = "360px";
    btn.style.right = "20px";
    btn.style.zIndex = 9999;
    btn.style.padding = "10px";
    btn.style.background = "#E91E63";
    btn.style.color = "#fff";

    btn.onclick = () => {

        const editLink = [...document.querySelectorAll("a")]
            .find(a => a.href.includes("page=DBForm") && a.textContent.includes("編集"));

        if (!editLink) {
            alert("編集リンク取得失敗");
            return;
        }

        const url = new URL(editLink.href, location.origin);
        url.searchParams.set("doCheck", "1");

        // ★同一タブで遷移（これが重要）
        location.href = url.toString();
    };

    document.body.appendChild(btn);
}

/********** ② DBFormで④実行 **********/
if (location.href.includes("page=DBForm")) {

    const url = new URL(location.href);
    if (url.searchParams.get("doCheck") !== "1") return;

    setTimeout(runCheck, 800);
}

/********** ④ 休憩チェック（完全版） **********/
function runCheck() {

    const sh = document.querySelector('select[name="5135.Hour"]');
    const sm = document.querySelector('select[name="5135.Minute"]');
    const eh = document.querySelector('select[name="5136.Hour"]');
    const em = document.querySelector('select[name="5136.Minute"]');

    if (!sh || !sm || !eh || !em) {
        alert("入力項目取得失敗");
        return;
    }

    const toMin = (h, m) => (parseInt(h || 0) * 60 + parseInt(m || 0));
    const round5 = v => Math.floor(v / 5) * 5;
    const toH = m => (m / 60).toFixed(2);
    const toHM = m => `${Math.floor(m/60)}:${String(m%60).padStart(2,"0")}`;
    const ceil5 = v => Math.ceil(v / 5) * 5;

    const holidayEl = document.querySelector("#dz_check277770");
    const isHoliday = holidayEl ? holidayEl.checked : false;

    const A1_raw = toMin(sh.value, sm.value);
    const A2_raw = toMin(eh.value, em.value);

    const B_raw = toMin(
        document.querySelector("#dz_fld2360")?.value,
        document.querySelector("#dz_fld2361")?.value
    );

    const C_raw = toMin(
        document.querySelector("#dz_fld2362")?.value,
        document.querySelector("#dz_fld2363")?.value
    );

    const D_raw = toMin(
        document.querySelector("#dz_fld2364")?.value,
        document.querySelector("#dz_fld2365")?.value
    );

    const E_raw = toMin(
        document.querySelector("#dz_fld2561")?.value,
        document.querySelector("#dz_fld2562")?.value
    );

    const A1 = round5(A1_raw);
    const A2 = round5(A2_raw);
    const B = round5(B_raw);
    const C = round5(C_raw);
    const D = round5(D_raw);
    const E = round5(E_raw);
    const A11 = ceil5(A1_raw);

    let startDef = A1;
    let type = "";

    if (A1 >= 300 && A1 <= 484) { startDef = 480; type="z"; }
    else if (A1 >= 485 && A1 <= 514) { startDef = 510; type="y"; }
    else if (A1 >= 515 && A1 <= 544) { startDef = 540; type="x"; }
    else if (A1 >= 720 && A1 <= 784) { startDef = 780; type="u"; }

    let A3 = startDef;
    let lunchAdd = (A1 < 720 && A2 > 780) ? 60 : 0;

    let Bdef1 = B;
    if (type === "z") Bdef1 = 1020;
    if (type === "y") Bdef1 = 1035;
    if (type === "x") Bdef1 = 1065;

    let Bdef = B;
    if (type === "z") Bdef = 1020;
    if (type === "y") Bdef = 1050;
    if (type === "x") Bdef = 1080;

    const restRaw = (E - D);
    const EE = lunchAdd;
    const rest = restRaw + EE;
    const rest2 = restRaw;

    const G = ((Bdef1 - A3) + (C - Bdef)) - ((E - D) + EE);
    const G_2 = (C - B) - (E - D);

    let result = "OK";
    if (G > 360 && rest < 45) result = `NG（45分不足）`;
    if (G > 480 && rest < 60) result = `NG（60分不足）`;

    let result2 = "OK";
    if (G_2 > 360 && rest2 < 45) result2 = `NG（45分不足）`;
    if (G_2 > 480 && rest2 < 60) result2 = `NG（60分不足）`;

    let msg;

// ===== 表示 =====
if (isHoliday) {

    let msg = `
○休日のとき(超勤　入力時間ベース)
【休憩チェック】${result2}
労働時間（G_2）：${toH(G_2)}h　休憩時間（E-D）${toH(rest2)}h　${Math.ceil(rest2)}分
＜式＞超勤時間(C - B) - 休憩時間(E - D) = G_2
(${toH(C)} - ${toH(B)}) - (${toH(E)} - ${toH(D)}) = ${toH(G_2)}
-------------------------------------------------------------------------------
【項目整合チェック】区分：勤務区分、5分：5分切捨て、5分上：5分切上げ
A3（出勤開始）： ${toH(A11)}h　←　5分上${toHM(A11)}　←　入力${toHM(A1_raw)}${A1 > 0 ? "OK" : "NG"}
A4（出勤終了）： ${toH(A2)}h　←　5分${toHM(A2)}　←　入力${toHM(A2_raw)}${A2 > 0 ? "OK" : "NG"}
B2（超勤実施開始）：${toH(B)}h　←　A3 ${toHM(A11)} vs 5分${toHM(B)}　←　入力${toHM(B_raw)}
C （超勤実施終了）：${toH(C)}h　←　A4 ${toHM(A2)} vs 5分${toHM(C)}　←　入力${toHM(C_raw)}
D （超勤休憩開始）：${toH(D)}h　←　5分${toHM(D)}　←　入力${toHM(D_raw)}
E （超勤休憩終了）：${toH(E)}h　←　5分${toHM(E)}　←　入力${toHM(E_raw)}
`;

    showPanel(msg.split("\n"));

} else {

    let msg = `
○平日のとき(通常勤務＋超勤　タイムカード、勤務区分、昼休憩を考慮)
【休憩チェック】${result}
労働時間（G）：${toH(G)}h　休憩時間（E-D）：${toH(rest)}h　${Math.ceil(rest)}分
-------------------------------------------------------------------------------
＜式＞勤務時間((A2 - A3) + 超勤時間(C - B1)) - 休憩時間((E -D)+ EE) = G
((${toH(Bdef1)} - ${toH(A3)}) + (${toH(C)} - ${toH(Bdef)})) - ((${toH(E)} - ${toH(D)}) + ${toH(EE)}) = ${toH(G)}
-------------------------------------------------------------------------------
【項目整合チェック】区分：勤務区分、5分：5分切捨て
A3（出勤開始）： ${toH(A3)}h　←　区分${toHM(A3)} vs 5分${toHM(A1)}　←　入力${toHM(A1_raw)}${A1 > 0 ? "OK" : "NG"}
A4（出勤終了）： ${toH(A2)}h　←　5分${toHM(A2)}　←　入力${toHM(A2_raw)}${A2 > 0 ? "OK" : "NG"}
A2（通常勤務終了）：${toH(Bdef1)}h　←　区分${toHM(Bdef1)}
B1（超勤実施開始）：${toH(B)}h　←　区分${toHM(Bdef)} vs 5分${toHM(B)}　←　入力${toHM(B_raw)}
C （超勤実施終了）：${toH(C)}h　←　A4 ${toHM(A2)} vs 5分${toHM(C)}　←　入力${toHM(C_raw)}
D （超勤休憩開始）：${toH(D)}h　←　5分${toHM(D)}　←　入力${toHM(D_raw)}
E （超勤休憩終了）：${toH(E)}h　←　5分${toHM(E)}　←　入力${toHM(E_raw)}
EE（通常昼休憩）：${toH(EE)}h
`;

    showPanel(msg.split("\n"));
}
}

/********** 表示＆戻る **********/
function showPanel(lines){

    const panel=document.createElement("div");
    panel.style=`
        position:fixed;top:80px;right:20px;
        background:#fff;border:2px solid #333;
        padding:18px;
        width:650px;height:400px;
        z-index:999999;
    `;

    lines.forEach(l=>{
        const d=document.createElement("div");
        d.textContent=l;
        if(l.includes("NG")) d.style.color="red";
        panel.appendChild(d);
    });

    const btn=document.createElement("button");
    btn.textContent="OK";

    btn.onclick=()=>{
        panel.remove();
        history.back(); // ★元画面へ戻る
    };

    panel.appendChild(btn);
    document.body.appendChild(panel);
}

})();
