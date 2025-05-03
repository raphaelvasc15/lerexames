// --- Variável Global para Resultados Parseados ---
let parsedResults = null;

// --- Constantes ---
const ABREVIACOES = {
    "Eritrócitos": "ERITRO", "Hemoglobina": "HB", "Hematócrito": "HT", "V.C.M.": "VCM",
    "H.C.M.": "HCM", "C.H.C.M.": "CHCM", "RDW": "RDW", "Leucócitos": "LEUCO",
    "Neutrófilos": "NEUTRO", "Eosinófilos": "EOS", "Basófilos": "BASO", "Linfócitos": "LINFO",
    "Monócitos": "MONO", "CONTAGEM DE PLAQUETAS": "PLA", "VPM": "VPM",
    "UREIA": "UREIA", "CREATININA": "CR", "TFGE para não-afrodescendentes": "TFGE",
    "SÓDIO": "NA", "POTÁSSIO": "K", "CLORO":"CL_SERUM", // Cloro Sérico
    "PROTEINA C REATIVA": "PCR", "MAGNÉSIO": "MG",
    "ASPARTATO AMINOTRANSFERASE - TGO(AST)": "TGO", "ALANINA AMINOTRANSFERASE - TGP(ALT)": "TGP",
    "FOSFATASE ALCALINA": "FA", "GAMA GLUTAMIL TRANSFERASE": "GGT", "AMILASE": "AMILASE",
    "Bilirrubina Total": "BT", "Bilirrubina Direta": "BD", "Bilirrubina Indireta": "BI",
    "Tempo Protrombina": "TAP", "Atividade de Protrombina": "AP", "INR": "INR",
    "Tempo Tromboplastina Parcial Ativada": "TTPA",
    "pH": "PH", "pCO2": "PCO2", "pO2": "PO2", "HCO3": "HCO3", "tCO2": "TCO2", "BE": "BE",
    "Saturação O2": "SAT O2", "Lactato": "LACTATO", "Glicose": "GLI",
    "Cácio Iônico": "CA++", "Cloro": "CL_GASO", // Cloro da Gaso
    "Ph_urina": "U1_Ph", "Proteína_urina": "U1_Prot", "Glicose_urina": "U1_Gli",
    "Corpos Cetonicos_urina": "U1_Ceto", "Bilirrubina_urina": "U1_Bili", "Urobilinogenio_urina": "U1_Urob",
    "Nitrito_urina": "U1_Nit", "Leucócitos_urina": "U1_Leu", "Hemácias_urina": "U1_Hem",
    "NT-PROBNP - FRAGMENTO N-TERMINAL DO PEPTÍDEO NATRIURÉTICO TIPO B": "NT-proBNP", // Novo
    "TROPONINA I DE ALTA SENSIBILIDADE": "Tropo I AS" // Novo
};
const ORDEM_GERAL = [ "HB", "HT", "ERITRO", "VCM", "HCM", "CHCM", "RDW", "LEUCO", "NEUTRO", "EOS", "BASO", "LINFO", "MONO", "PLA", "UREIA", "CR", "TFGE", "NA", "K", "CL_SERUM", "PCR", "NT-proBNP", "Tropo I AS", "MG", "TGO", "TGP", "FA", "GGT", "BT", "BD", "BI", "AMILASE", "TAP", "AP", "INR", "TTPA", ];
const ORDEM_GASO = [ "PH", "PCO2", "PO2", "HCO3", "TCO2", "BE", "SAT O2", "HB", "HT", "LACTATO", "GLI", "CA++", "CL_GASO" ];
const ORDEM_URINA_I = [ "U1_Ph", "U1_Prot", "U1_Gli", "U1_Ceto", "U1_Bili", "U1_Urob", "U1_Nit", "U1_Leu", "U1_Hem" ];
const UPPERCASE_ABBRS = new Set([ "VCM", "HCM", "CHCM", "RDW", "TFGE", "PCR", "TGO", "TGP", "BT", "BD", "BI", "TAP", "AP", "INR", "TTPA", "NT-proBNP" ]);
// CORRIGIDO: Mapa de Casing da Gasometria
const GASO_CASING_MAP = { "PH": "pH", "PCO2": "pCO2", "PO2": "pO2", "HCO3": "HCO3", "TCO2": "tCO2", "BE": "BE", "CA++": "Ca++", "CL_GASO": "Cl" };

// --- Funções Auxiliares ---
function toTitleCase(str) { if (!str) return ''; return str.toLowerCase().replace(/([^\s-]+)/g, word => word.charAt(0).toUpperCase() + word.slice(1)); }
function extrairValorSimples(regex, texto, trimResult = true) { const match = texto.match(regex); if (match && match[1] !== undefined && match[1] !== null) { let valor = match[1]; if (trimResult) { valor = valor.trim().replace(/\s+/g, ' '); } if (/^-?[\d]+,[\d]+$/.test(valor.trim())) { valor = valor.replace(',', '.'); } return valor; } return null; }
function extrairValorComposto(regex, texto) { const match = texto.match(regex); if (match) { const vT = []; for (let i = 1; i < match.length; i++) { if (match[i] !== undefined && match[i] !== null) { let v = match[i].trim(); if (/^-?[\d]+,[\d]+$/.test(v)) { v = v.replace(',', '.'); } vT.push(v); } else { vT.push(null); } } return vT; } return null; }

// ATUALIZADO: abreviarResultadoCultura para detalhar positivo
function abreviarResultadoCultura(textoResultado) {
    if (!textoResultado) return "N/A";
    let textoLimpio = textoResultado.replace(/Resultado(?: parcial)?:/i, "").trim();
    let textoLower = textoLimpio.toLowerCase().replace(/\.$/, '');

    if (textoLower.includes("em andamento")) return "Andamento";
    if (textoLower.includes("negativo") || textoLower.includes("não houve crescimento") || textoLower.includes("ausência de crescimento")) return "Negativo";

    const linhasResultado = textoLimpio.split('\n');
    let resultadoPositivo = null;
    if (linhasResultado.length > 0) {
         for (let linha of linhasResultado) {
             linha = linha.trim();
             if (linha && (linha.toLowerCase().includes("isolado") || linha.match(/\d[\d.,]*\s*ufc\/ml/i) || linha.toLowerCase().match(/(?:escherichia|klebsiella|proteus|staphylococcus|streptococcus|enterococcus)/) )) {
                 resultadoPositivo = linha; break;
             }
         }
    }
    if(resultadoPositivo) {
        return resultadoPositivo.length > 60 ? resultadoPositivo.substring(0, 57) + "..." : resultadoPositivo;
    } else if (textoLimpio.length > 0 && !(textoLower.includes("negativo") || textoLower.includes("não houve crescimento") || textoLower.includes("ausência de crescimento")) ){
       return "Positivo (ver detalhes)";
    }
    return textoLimpio.split('\n')[0].trim() || "Positivo (detalhe não extraído)";
}

function formatarResultadoUrina(paramAbbr, resultText) { if (resultText === null || resultText === undefined) return null; const tC = resultText.trim(); const tL = tC.toLowerCase(); if (paramAbbr === "U1_Ph") { const mP = tC.match(/(\d[\d.,]*)/); return mP ? mP[1].replace(',', '.') : tC; } if (paramAbbr === "U1_Nit") { if (tL.includes("positivo")) return "+"; if (tL.includes("negativo") || tL.includes("ausente")) return "-"; return tC; } if (paramAbbr === "U1_Hem") { if (tL.includes("negativo") || tL.includes("ausente") || tL.includes("traços")) return "-"; if (tC.includes("+++")) return "+++"; if (tC.includes("++")) return "++"; if (tC.includes("+")) return "+"; return tC; } if (paramAbbr === "U1_Urob") { if (tL.includes("normal")) return "Normal"; return tC; } const gG = ["U1_Prot", "U1_Gli", "U1_Ceto", "U1_Bili", "U1_Leu"]; if (gG.includes(paramAbbr)) { if (tL.includes("ausente") || tL.includes("negativo") || tL.includes("traços")) return "-"; if (tC.includes("+++")) return "+++"; if (tC.includes("++")) return "++"; if (tC.includes("+")) return "+"; return tC; } return null; }

// --- Função Principal (JavaScript) ---
function formatarExamesJS(textoCompleto) {
    try {
        let resGeral = {}; let resGasoV = {}; let resGasoA = {};
        let resUrinaI = {}; let resCulturas = []; let dataColetaPrincipal = null;

        // 1. Encontrar Data (Usando a lógica que você confirmou funcionar)
        let mD = textoCompleto.match(/Hora de coleta aproximada\s*\((\d{2}\/\d{2}\/\d{4})(?:\s+\d{2}:\d{2})?\)/i);
        if(mD) dataColetaPrincipal=mD[1]; else { mD=textoCompleto.match(/Liberado\s*\((\d{2}\/\d{2}\/\d{4})(?:\s+\d{2}:\d{2})?\)/i); if(mD) dataColetaPrincipal=mD[1]; else { mD=textoCompleto.match(/CULTURA DE URINA[\s\S]*?Liberado\s*\((\d{2}\/\d{2}\/\d{4})/i); if(mD) dataColetaPrincipal=mD[1]; else { mD=textoCompleto.match(/HEMOCULTURA[\s\S]*?Liberado\s*\((\d{2}\/\d{2}\/\d{4})/i); if(mD) dataColetaPrincipal=mD[1]; else return "Erro: Data principal não encontrada.";}}}

        // --- Extrações ---
        resGeral["ERITRO"] = extrairValorSimples(/(\d[\d.,]*)\s+milhões\/mm³/is, textoCompleto);
        resGeral["HB"] = extrairValorSimples(/(\d[\d.,]*)\s+g\/dL\s+Hemoglobina/is, textoCompleto);
        resGeral["HT"] = extrairValorSimples(/(\d[\d.,]*)\s+%\s+Hematócrito/is, textoCompleto);
        resGeral["VCM"] = extrairValorSimples(/(\d[\d.,]*)\s+fL\s+V\.C\.M\./is, textoCompleto);
        resGeral["HCM"] = extrairValorSimples(/(\d[\d.,]*)\s+pg\s+H\.C\.M\./is, textoCompleto);
        resGeral["CHCM"] = extrairValorSimples(/(\d[\d.,]*)\s+g\/dL\s+C\.H\.C\.M\./is, textoCompleto);
        resGeral["RDW"] = extrairValorSimples(/(\d[\d.,]*)\s+%\s+RDW/is, textoCompleto);
        resGeral["LEUCO"] = extrairValorSimples(/(\d[\d.,]*)\s+\/mm³\s+Leucócitos/is, textoCompleto);
        resGeral["PLA"] = extrairValorSimples(/(\d[\d.,]*)\s+\/mm³\s+CONTAGEM DE PLAQUETAS/is, textoCompleto);
        const leucoItems = { "Neutrófilos": "NEUTRO", "Eosinófilos": "EOS", "Basófilos": "BASO", "Linfócitos": "LINFO", "Monócitos": "MONO" }; for (const [nome, abbr] of Object.entries(leucoItems)) { const rL = new RegExp(`(\\d[\\d.,]*)\\s+%\\s+(\\d[\\d.,]*)\\s+\\/mm³\\s+${nome}`, 'is'); const vL = extrairValorComposto(rL, textoCompleto); if (vL && vL.length >= 2 && vL[0] !== null && vL[1] !== null) { resGeral[abbr] = `${vL[0]}% (${vL[1]})`; } else if (vL && vL.length >= 1 && vL[0] !== null) { resGeral[abbr] = `${vL[0]}%`; } }
        resGeral["UREIA"] = extrairValorSimples(/UREIA\s*\n.*?Resultado:\s*(\d[\d.,]*)\s+mg\/dL/is, textoCompleto);
        resGeral["CR"] = extrairValorSimples(/CREATININA\s*\n.*?Resultado:\s*(\d[\d.,]*)\s+mg\/dL/is, textoCompleto);
        resGeral["TFGE"] = extrairValorSimples(/TFGE para não-afrodescendentes:\s*([><]?\s*\d[\d.,]*)\s+mL\/min/is, textoCompleto);
        resGeral["NA"] = extrairValorSimples(/SÓDIO\s*\n.*?Resultado:\s*(\d[\d.,]*)\s+mEq\/L/is, textoCompleto);
        resGeral["K"] = extrairValorSimples(/POTÁSSIO\s*\n.*?Resultado:\s*(\d[\d.,]*)\s+mEq\/L/is, textoCompleto);
        resGeral["CL_SERUM"] = extrairValorSimples(/CLORO\s*\n.*?Resultado:\s*(\d[\d.,]*)\s+mEq\/L/is, textoCompleto); // Extração Cloro Sérico
        resGeral["PCR"] = extrairValorSimples(/PROTEINA C REATIVA\s*\n.*?Resultado:\s*(<?\s*\d[\d.,]*)\s+mg\/L/is, textoCompleto);
        resGeral["MG"] = extrairValorSimples(/MAGNÉSIO\s*\n.*?Resultado:\s*(\d[\d.,]*)\s+mg\/dL/is, textoCompleto);
        resGeral["TGO"] = extrairValorSimples(/ASPARTATO AMINOTRANSFERASE - TGO\(AST\)\s*\n.*?Resultado:\s*(\d[\d.,]*)\s+U\/L/is, textoCompleto);
        resGeral["TGP"] = extrairValorSimples(/ALANINA AMINOTRANSFERASE - TGP\(ALT\)\s*\n.*?Resultado:\s*(<?\s*\d[\d.,]*)\s+U\/L/is, textoCompleto);
        resGeral["FA"] = extrairValorSimples(/FOSFATASE ALCALINA\s*\n.*?Resultado:\s*(\d[\d.,]*)\s+U\/L/is, textoCompleto);
        resGeral["GGT"] = extrairValorSimples(/GAMA GLUTAMIL TRANSFERASE\s*\n.*?Resultado:\s*(\d[\d.,]*)\s+U\/L/is, textoCompleto);
        resGeral["AMILASE"] = extrairValorSimples(/AMILASE\s*\n.*?Resultado:\s*(\d[\d.,]*)\s+U\/L/is, textoCompleto);
        // Adicionada extração Tropo e BNP
        resGeral["NT-proBNP"] = extrairValorSimples(/NT-PROBNP.*?Resultado:\s*([><]?\s*\d[\d.,]*)\s+pg\/mL/is, textoCompleto);
        resGeral["Tropo I AS"] = extrairValorSimples(/TROPONINA I DE ALTA SENSIBILIDADE.*?Resultado:\s*(<?\s*\d[\d.,]*)\s+ng\/L/is, textoCompleto);
        const bBM = textoCompleto.match(/BILIRRUBINA TOTAIS E FRAÇÕES.*?Material:/is); if (bBM) { const bB = bBM[0]; resGeral["BT"] = extrairValorSimples(/Bilirrubina Total\s*:\s*(\d[\d.,]*)\s+mg\/dL/is, bB); resGeral["BD"] = extrairValorSimples(/Bilirrubina Direta\s*:\s*(\d[\d.,]*)\s+mg\/dL/is, bB); resGeral["BI"] = extrairValorSimples(/Bilirrubina Indireta\s*:\s*(\d[\d.,]*)\s+mg\/dL/is, bB); }
        const bCM = textoCompleto.match(/COAGULOGRAMA COMPLETO.*?(?:Material:|Liberação:|Médico Responsável|-----)/is); if (bCM) { const bC = bCM[0]; const tV = extrairValorSimples(/Tempo Protrombina\s*:\s*(\d[\d.,]*)\s*segundos/is, bC); if(tV)resGeral["TAP"]=`${tV}s`; const aV = extrairValorSimples(/Atividade de Protrombina\s*:\s*(\d[\d.,]*)\s*%/is, bC); if(aV)resGeral["AP"]=`${aV}%`; resGeral["INR"] = extrairValorSimples(/INR\s*:\s*(\d[\d.,]*)/is, bC); const ttV = extrairValorSimples(/Tempo Tromboplastina Parcial Ativada\s*:\s*(\d[\d.,]*)\s*segundos/is, bC); if(ttV)resGeral["TTPA"]=`${ttV}s`; }

        // Gasometria
        const bGM = textoCompleto.match(/GASOMETRIA\s+(VENOSA|ARTERIAL).*?(?:Liberação:|Médico Responsável|Notas:|Material:)/is); if (bGM) { const tG=bGM[1].toUpperCase(); const bG=bGM[0]; let rGT = null; if(tG==="VENOSA")rGT=resGasoV; else if(tG==="ARTERIAL")rGT=resGasoA; if(rGT){ rGT["PH"]=extrairValorSimples(/pH:\s*(\d[\d.,]*)/is,bG); rGT["PCO2"]=extrairValorSimples(/pCO2:\s*(\d[\d.,]*)\s+mmHg/is,bG); rGT["PO2"]=extrairValorSimples(/pO2:\s*(\d[\d.,]*)\s+mmHg/is,bG); rGT["HCO3"]=extrairValorSimples(/HCO3:\s*(\d[\d.,]*)\s+mmol\/L/is,bG); rGT["TCO2"]=extrairValorSimples(/tCO2:\s*(\d[\d.,]*)\s+mmol\/L/is,bG); rGT["BE"]=extrairValorSimples(/BE:\s*([-+]?\d[\d.,]*)\s+mmol\/L/is,bG); rGT["SAT O2"]=extrairValorSimples(/Saturação O2:\s*(\d[\d.,]*)\s+%/is,bG); rGT["HB"]=extrairValorSimples(/Hemoglobina:\s*(\d[\d.,]*)\s+g\/dL/is,bG); rGT["HT"]=extrairValorSimples(/Hematócrito:\s*(\d[\d.,]*)\s+%/is,bG); rGT["LACTATO"]=extrairValorSimples(/Lactato:\s*(\d[\d.,]*)\s+mmol\/L/is,bG); rGT["GLI"]=extrairValorSimples(/Glicose:\s*(\d[\d.,]*)\s+mg\/dL/is,bG); rGT["CA++"]=extrairValorSimples(/Cácio Iônico:\s*(\d[\d.,]*)\s+mmol\/L/is,bG); rGT["CL_GASO"]=extrairValorSimples(/Cloro:\s*(\d[\d.,]*)\s+mEq\/\s*L/is,bG); }}

        // Urina Tipo I
        const bUM = textoCompleto.match(/URINA TIPO I.*?Material:/is); if (bUM) { const bU = bUM[0]; resUrinaI["U1_Ph"]=extrairValorSimples(/Ph\s*:\s*(\d[\d.,]*)/is,bU); resUrinaI["U1_Prot"]=extrairValorSimples(/Proteína\s*:\s*(Presente\s*\+*|Ausente|Negativo|Traços)/is,bU,false); resUrinaI["U1_Gli"]=extrairValorSimples(/Glicose\s*:\s*(Presente\s*\+*|Ausente|Negativo|Traços)/is,bU,false); resUrinaI["U1_Ceto"]=extrairValorSimples(/Corpos Cetonicos\s*:\s*(Presente\s*\+*|Ausente|Negativo|Traços)/is,bU,false); resUrinaI["U1_Bili"]=extrairValorSimples(/Bilirrubina\s*:\s*(Presente\s*\+*|Ausente|Negativo|Traços)/is,bU,false); resUrinaI["U1_Urob"]=extrairValorSimples(/Urobilinogenio\s*:\s*(Normal|Aumentado|Presente|Ausente)/is, bU, false); resUrinaI["U1_Nit"]=extrairValorSimples(/Nitrito\s*:\s*(Positivo|Negativo|Ausente)/is,bU,false); resUrinaI["U1_Leu"]=extrairValorSimples(/Leucócitos\s*:\s*(Presente\s*\+*|Ausente|Negativo|Traços)/is,bU,false); resUrinaI["U1_Hem"]=extrairValorSimples(/Hemácias\s*:\s*(Presente\s*\+*|Ausente|Negativo|Traços)/is,bU,false); }

        // Culturas (Regex urocultura CORRIGIDO + Abreviação Atualizada)
        const ucRegex = /(CULTURA DE URINA)\s*\n.*?Resultado:([\s\S]*?)(?:TESTE DE SENSIBILIDADE|Valor de referência|Método|Liberação:)/gis; for (const m of textoCompleto.matchAll(ucRegex)) { const tE="Urocultura"; const rT=m[2].trim(); const rA=abreviarResultadoCultura(rT); if (!resCulturas.some(p=>p[0]===tE&&p[1]===rA)) resCulturas.push([tE,rA]); }
        const hemoR = /(HEMOCULTURA (AERÓBICA|ANAERÓBICA))\s*(?:-\s*(\d+)\s*AMOSTRA)?\s*\n.*?Resultado:([^\r\n]+)/gis; for (const m of textoCompleto.matchAll(hemoR)) { const tB=m[2].toUpperCase(); const aN=m[3]; const rT=m[4]; const rA=abreviarResultadoCultura(rT); let tE=tB==="AERÓBICA"?"AERÓBIA":tB==="ANAERÓBICA"?"ANAERÓBIA":""; if(aN)tE+=`(${aN})`; if (tE&&!resCulturas.some(p=>p[0]===tE&&p[1]===rA)) resCulturas.push([tE,rA]); }

        // --- Montagem da Saída ---
        let outputFinal = ["# LABORATÓRIOS:"]; let algumResultadoAdicionado = false;
        // Linha Geral (Ajustado para exibir "Tropo" em vez de "Tropo I AS")
        let lGI = [];
        for (const abbr of ORDEM_GERAL) {
            if (resGeral[abbr] !== undefined && resGeral[abbr] !== null) {
                let displayAbbr = abbr;
                if (abbr === "Tropo I AS") { displayAbbr = "Tropo"; } // Nome específico
                else if (UPPERCASE_ABBRS.has(abbr)) { displayAbbr = abbr; }
                else { displayAbbr = toTitleCase(abbr); }
                lGI.push(`${displayAbbr} ${resGeral[abbr]}`);
            }
        }
        if (lGI.length > 0) { outputFinal.push(`${dataColetaPrincipal} - ${lGI.join(' // ')}`); algumResultadoAdicionado = true; }
        // Linha Gaso Venosa
        let lGV = []; for (const abbr of ORDEM_GASO) { const v = resGasoV[abbr]; if (v !== undefined && v !== null) { let dA; if (GASO_CASING_MAP[abbr]) dA=GASO_CASING_MAP[abbr]; else if (UPPERCASE_ABBRS.has(abbr)) dA=abbr; else dA=toTitleCase(abbr); lGV.push(`${dA} ${v}`); } } if (lGV.length > 0) { if (algumResultadoAdicionado && outputFinal[outputFinal.length - 1] !== "") outputFinal.push(""); outputFinal.push(`${dataColetaPrincipal} - GASOMETRIA VENOSA: ${lGV.join(' // ')}`); algumResultadoAdicionado = true; }
        // Linha Gaso Arterial
        let lGA = []; for (const abbr of ORDEM_GASO) { const v = resGasoA[abbr]; if (v !== undefined && v !== null) { let dA; if (GASO_CASING_MAP[abbr]) dA=GASO_CASING_MAP[abbr]; else if (UPPERCASE_ABBRS.has(abbr)) dA=abbr; else dA=toTitleCase(abbr); lGA.push(`${dA} ${v}`); } } if (lGA.length > 0) { if (algumResultadoAdicionado && outputFinal[outputFinal.length - 1] !== "") outputFinal.push(""); outputFinal.push(`${dataColetaPrincipal} - GASOMETRIA ARTERIAL: ${lGA.join(' // ')}`); algumResultadoAdicionado = true; }
        // Linha Urina I (Ajustado para usar pH e Urob)
        let lUI = []; const mNU = { "U1_Ph": "pH", "U1_Prot": "Prot", "U1_Gli": "Gli", "U1_Ceto": "Ceto", "U1_Bili": "Bili", "U1_Urob": "Urob", "U1_Nit": "Nit", "U1_Leu": "Leu", "U1_Hem": "Hem" }; for (const aI of ORDEM_URINA_I) { const rR = resUrinaI[aI]; const fR = formatarResultadoUrina(aI, rR); if (fR !== null) { const nE = mNU[aI] || aI; lUI.push(`${nE} ${fR}`); } } if (lUI.length > 0) { if (algumResultadoAdicionado && outputFinal[outputFinal.length - 1] !== "") outputFinal.push(""); outputFinal.push(`${dataColetaPrincipal} - URINA I: ${lUI.join(', ')}`); algumResultadoAdicionado = true; }
         // Linha Culturas
        if (resCulturas.length > 0) { let lCI = []; function gCSK(cT){ const tC=cT[0]; let bO=9; if(tC.includes("AERÓBIA"))bO=1; else if(tC.includes("ANAERÓBIA"))bO=2; else if(tC.includes("Urocultura"))bO=3; const mN=tC.match(/\((\d+)\)/); const aN=mN?parseInt(mN[1]):0; return bO*100+aN; } resCulturas.sort((a,b)=>gCSK(a)-gCSK(b)); for (const [tA, rA] of resCulturas) { const dT = UPPERCASE_ABBRS.has(tA) ? tA : toTitleCase(tA); lCI.push(`${dT}: ${rA}`); } if (lCI.length > 0) { if (algumResultadoAdicionado && outputFinal[outputFinal.length - 1] !== "") outputFinal.push(""); outputFinal.push(`${dataColetaPrincipal} - CULTURAS: ${lCI.join(' // ')}`); algumResultadoAdicionado = true; } }

        // Retorno Final
        const results = { resGeral, resGasoV, resGasoA, resUrinaI, resCulturas }; // Guarda todos os resultados parseados
        let finalFormattedString = "";
        if (outputFinal.length > 1) { finalFormattedString = outputFinal.join("\n"); }
        else if (dataColetaPrincipal) { finalFormattedString = `# LABORATÓRIOS:\n${dataColetaPrincipal} - Nenhum exame reconhecido encontrado para esta data.`; }
        else { finalFormattedString = "# LABORATÓRIOS:\nNenhum exame reconhecido ou data encontrados no texto."; }
        return { formattedString: finalFormattedString, results: results }; // Retorna objeto

    } catch (error) { console.error("Erro durante formatação:", error); return `Erro interno no processamento: ${error.message}\n${error.stack ? error.stack.split('\n').slice(0, 5).join('\n') : '(sem stack trace)'}`; }
} // --- Fim de formatarExamesJS ---


// --- Nova Função: Interpretar Gasometria ---
function interpretarGasometria() {
    const gasoOutputArea = document.getElementById('gasoOutputArea');
    gasoOutputArea.style.display = 'none'; gasoOutputArea.textContent = '';
    gasoOutputArea.classList.remove('error-message');

    if (!parsedResults) { return "Erro: Processe os exames primeiro."; }

    // --- Seleciona qual Gaso usar (Prioriza Arterial) ---
    let gaso = null;
    let tipoGaso = null;
    const gasoAValida = parsedResults.resGasoA && !isNaN(parseFloat(parsedResults.resGasoA["PH"]?.replace(',', '.'))) && !isNaN(parseFloat(parsedResults.resGasoA["PCO2"]?.replace(',', '.'))) && !isNaN(parseFloat(parsedResults.resGasoA["HCO3"]?.replace(',', '.')));
    const gasoVValida = parsedResults.resGasoV && !isNaN(parseFloat(parsedResults.resGasoV["PH"]?.replace(',', '.'))) && !isNaN(parseFloat(parsedResults.resGasoV["PCO2"]?.replace(',', '.'))) && !isNaN(parseFloat(parsedResults.resGasoV["HCO3"]?.replace(',', '.')));

    if (gasoAValida) {
        gaso = parsedResults.resGasoA;
        tipoGaso = "Arterial";
    } else if (gasoVValida) {
        gaso = parsedResults.resGasoV;
        tipoGaso = "Venosa";
    } else {
         return "Erro: Nenhum dado de gasometria (Arterial ou Venosa) válido encontrado para interpretar.";
    }
    // ----------------------------------------------------

    const geral = parsedResults.resGeral || {};

    // Converte valores para números (usando o objeto 'gaso' selecionado)
    const pH = parseFloat(gaso["PH"]?.replace(',', '.'));
    const pCO2 = parseFloat(gaso["PCO2"]?.replace(',', '.'));
    const HCO3 = parseFloat(gaso["HCO3"]?.replace(',', '.'));
    const Na = parseFloat(geral["NA"]?.replace(',', '.'));
    const Cl = parseFloat(geral["CL_SERUM"]?.replace(',', '.'));

    // Verifica novamente (embora a seleção acima já deva garantir)
    if (isNaN(pH) || isNaN(pCO2) || isNaN(HCO3)) {
        return `Erro: Valores de pH, pCO2 ou HCO3 inválidos ou não encontrados na Gasometria ${tipoGaso}.`;
    }

    // --- Lógica de Interpretação (EXISTENTE - sem mudanças aqui) ---
    const LSN_PH = 7.35, USN_PH = 7.45; const LSN_PCO2 = 35, USN_PCO2 = 45; const LSN_HCO3 = 22, USN_HCO3 = 26; const NORMAL_AG = 12;
    let dP = "Indeterminado"; let iP = []; let comp = "Não avaliada"; let pEI = ""; let hEI = ""; let agI = ""; let dI = ""; let dM = [];
    // ... (TODA a lógica if/else if/else para determinar iP, comp, etc., permanece a mesma) ...
    if (pH < LSN_PH) { iP.push("Acidose"); if (pCO2 > USN_PCO2) { dP = "Respiratória"; iP.push("Respiratória Primária."); let hA = 24 + 0.1 * (pCO2 - 40); let hC = 24 + 0.35 * (pCO2 - 40); hEI = ` (HCO3 esp ~<span class="math-inline">\{hA\.toFixed\(1\)\} \[aguda\] ou \~</span>{hC.toFixed(1)} [crônica])`; if (HCO3 > hC + 2) comp = "Compensação Metabólica Alcalina Excessiva."; else if (HCO3 > hA + 2) comp = "Compensação Metabólica Presente (pode ser crônica)."; else if (HCO3 < hA - 2) comp = "Compensação Metabólica Insuficiente."; else comp = "Compensação Metabólica Presente (aguda/desenvolvimento)."; } else if (HCO3 < LSN_HCO3) { dP = "Metabólica"; iP.push("Metabólica Primária"); if (!isNaN(Na) && !isNaN(Cl)) { const ag = Na - (Cl + HCO3); agI = ` AG = ${ag.toFixed(1)}.`; iP.push(`com Anion Gap ${ag >= NORMAL_AG + 2 ? 'Elevado.' : 'Normal.'}`); if (ag >= NORMAL_AG + 2 && HCO3 < 24) { const dG = (ag - NORMAL_AG) / (24 - HCO3); if (!isNaN(dG) && isFinite(dG)) {dI = ` Delta/Delta = ${dG.toFixed(2)}.`; if (dG < 0.8) dM.push("Acidose Hiperclorêmica concomitante?"); if (dG > 1.8) dM.push("Alcalose Metabólica concomitante?"); } else { dI = " (Delta/Delta não calculável)";} } } else { agI = " (AG não calculado - Na ou Cl sérico ausente)."; iP.push(agI); } const pE = (1.5 * HCO3) + 8; pEI = ` (pCO2 esp [Winter] ~${pE.toFixed(1)} mmHg)`; if (pCO2 < pE - 2) comp = "Compensação Respiratória Excessiva."; else if (pCO2 > pE + 2) comp = "Compensação Respiratória Insuficiente."; else comp = "Compensação Respiratória Presente."; } else { iP.push("(Possível distúrbio misto - pH ácido)."); if (pCO2 > USN_PCO2 && HCO3 < LSN_HCO3) dM.push("Acidose Mista (Resp + Metab)"); }
    } else if (pH > USN_PH) { iP.push("Alcalose"); if (pCO2 < LSN_PCO2) { dP = "Respiratória"; iP.push("Respiratória Primária."); let hA = 24 - 0.2 * (40 - pCO2); let hC = 24 - 0.4 * (40 - pCO2); hEI = ` (HCO3 esp ~<span class="math-inline">\{hA\.toFixed\(1\)\} \[aguda\] ou \~</span>{hC.toFixed(1)} [crônica])`; if (HCO3 < hC - 2) comp = "Compensação Metabólica Ácida Excessiva."; else if (HCO3 < hA - 2) comp = "Compensação Metabólica Presente (pode ser crônica)."; else if (HCO3 > hA + 2) comp = "Compensação Metabólica Insuficiente."; else comp = "Compensação Metabólica Presente (aguda/desenvolvimento)."; } else if (HCO3 > USN_HCO3) { dP = "Metabólica"; iP.push("Metabólica Primária."); const pE = (0.7 * HCO3) + 20; pEI = ` (pCO2 esp ~${(pE - 5).toFixed(1)} a ${(pE + 5).toFixed(1)} mmHg)`; if (pCO2 > pE + 5) comp = "Compensação Respiratória Excessiva."; else if (pCO2 < pE - 5) comp = "Compensação Respiratória Insuficiente."; else comp = "Compensação Respiratória Presente."; } else { iP.push("(Possível distúrbio misto - pH alcalino)."); if (pCO2 < LSN_PCO2 && HCO3 > USN_HCO3) dM.push("Alcalose Mista (Resp + Metab)"); }
    } else { iP.push("pH Normal."); dP = "Normal/Compensado"; comp = "Compensação completa ou normalidade."; if (pCO2 > USN_PCO2 && HCO3 > USN_HCO3) { iP.push(" Sugere Acid Resp Crônica compensada ou Alcal Metab compensada."); } else if (pCO2 < LSN_PCO2 && HCO3 < LSN_HCO3) { iP.push(" Sugere Alcal Resp Crônica compensada ou Acid Metab compensada."); } else if (pCO2 > USN_PCO2) { iP.push(" Sugere Acidose Respiratória compensada."); } else if (pCO2 < LSN_PCO2) { iP.push(" Sugere Alcalose Respiratória compensada."); } else if (HCO3 < LSN_HCO3) { iP.push(" Sugere Acidose Metabólica compensada."); } else if (HCO3 > USN_HCO3) { iP.push(" Sugere Alcalose Metabólica compensada."); } else { iP.push(" Gases dentro dos limites normais."); comp = "Não aplicável"; } }


    // --- Montagem Final da String (Adiciona indicação Arterial/Venosa) ---
    let finalReport = `--- Interpretação da Gasometria ${tipoGaso} ---\n`; // Adiciona o tipo
    finalReport += iP.join(" ") + agI + dI;
    if (comp !== "Não avaliada" && comp !== "Não aplicável") { finalReport += `\nCompensação: <span class="math-inline">\{comp\}</span>{pEI}${hEI}`; }
    if (dM.length > 0) { finalReport += `\nPossível Distúrbio Misto Adicional: ${dM.join(', ')}`; }
    finalReport += "\n\nNota: Interpretação automatizada básica. Correlacionar com clínica.";
    return finalReport;

} // --- Fim de interpretarGasometria ---

// --- Event Listeners ---
const processButton=document.getElementById('processButton'); const inputText=document.getElementById('inputText'); const outputArea=document.getElementById('outputArea'); const uppercaseToggle=document.getElementById('uppercaseToggle'); const copyButton=document.getElementById('copyButton'); const clearButton=document.getElementById('clearButton'); const pasteButton=document.getElementById('pasteButton'); const gasoButton = document.getElementById('gasoButton'); const gasoOutputArea = document.getElementById('gasoOutputArea');
let lastRawResult='';

function updateDisplay(){let tTD=lastRawResult; if(uppercaseToggle.checked&&lastRawResult){tTD=lastRawResult.toUpperCase();} outputArea.textContent=tTD||'Aguardando entrada...'; if(!lastRawResult&&!outputArea.classList.contains('error-message')){outputArea.classList.remove('loading-message');}else if(lastRawResult){outputArea.classList.remove('loading-message','error-message');}}

// Listener do Botão Principal (MODIFICADO para lidar com retorno de objeto e habilitar/desabilitar botão gaso)
processButton.addEventListener('click',()=>{
    const texto = inputText.value.trim();
    if (!texto){lastRawResult='';parsedResults=null;outputArea.textContent='Por favor, cole o texto do exame na área acima.';outputArea.classList.add('error-message');outputArea.classList.remove('loading-message');gasoButton.disabled=true;gasoOutputArea.style.display='none';return;}
    outputArea.classList.remove('error-message','loading-message');gasoOutputArea.style.display='none';
    outputArea.textContent = ''; // Limpa output principal

    const formatResult = formatarExamesJS(texto); // Chama a função JS

    if (typeof formatResult === 'string' && formatResult.startsWith("Erro:")) { // Verifica se retornou string de erro
        lastRawResult = ''; parsedResults = null;
        outputArea.textContent = formatResult;
        outputArea.classList.add('error-message');
        gasoButton.disabled = true; gasoButton.style.backgroundColor = '#6c757d';
    } else if (typeof formatResult === 'object' && formatResult.formattedString !== undefined && formatResult.results !== undefined) { // Verifica se retornou o objeto esperado
        lastRawResult = formatResult.formattedString;
        parsedResults = formatResult.results; // Guarda resultados parseados globalmente
        updateDisplay(); // Atualiza área principal

        // Habilita/desabilita botão de interpretar gaso (Verifica Arterial OU Venosa)
        const gasoAValida = parsedResults && parsedResults.resGasoA &&
                           !isNaN(parseFloat(parsedResults.resGasoA["PH"]?.replace(',', '.'))) &&
                           !isNaN(parseFloat(parsedResults.resGasoA["PCO2"]?.replace(',', '.'))) &&
                           !isNaN(parseFloat(parsedResults.resGasoA["HCO3"]?.replace(',', '.')));
        const gasoVValida = parsedResults && parsedResults.resGasoV &&
                           !isNaN(parseFloat(parsedResults.resGasoV["PH"]?.replace(',', '.'))) &&
                           !isNaN(parseFloat(parsedResults.resGasoV["PCO2"]?.replace(',', '.'))) &&
                           !isNaN(parseFloat(parsedResults.resGasoV["HCO3"]?.replace(',', '.')));

        if(gasoAValida || gasoVValida) { // Habilita se QUALQUER uma for válida
             gasoButton.disabled = false;
             gasoButton.style.backgroundColor = '#17a2b8'; // Cor habilitado
             // Opcional: Ajustar texto do botão se quiser indicar qual será interpretada (ex: prioriza arterial)
             // if(gasoAValida) { gasoButton.textContent = 'Interpretar Gaso Arterial'; }
             // else { gasoButton.textContent = 'Interpretar Gaso Venosa'; }
        } else {
             gasoButton.disabled = true;
             gasoButton.style.backgroundColor = '#6c757d'; // Cor desabilitado
             // gasoButton.textContent = 'Interpretar Gasometria'; // Texto padrão
        }
    } else {
        // Caso inesperado
        console.error("Resultado inesperado de formatarExamesJS:", formatResult);
        lastRawResult = ''; parsedResults = null;
        outputArea.textContent = "Erro: Falha inesperada ao formatar os exames.";
        outputArea.classList.add('error-message');
        gasoButton.disabled = true; gasoButton.style.backgroundColor = '#6c757d';
    }
});

uppercaseToggle.addEventListener('change',updateDisplay);
copyButton.addEventListener('click',async()=>{const tTC=outputArea.textContent; const iP=tTC==='Aguardando entrada...'; const iLE=outputArea.classList.contains('loading-message')||outputArea.classList.contains('error-message'); if(tTC&&!iP&&!iLE){try{await navigator.clipboard.writeText(tTC); const oT=copyButton.textContent; const oB=copyButton.style.backgroundColor; copyButton.textContent='Copiado!'; copyButton.style.backgroundColor='#218838'; copyButton.disabled=true; setTimeout(()=>{copyButton.textContent=oT;copyButton.style.backgroundColor=oB;copyButton.disabled=false;},1500);}catch(err){console.error('Erro ao copiar:',err); alert('Erro ao copiar.');}}else{const oT=copyButton.textContent; copyButton.textContent='Nada a copiar!'; copyButton.disabled=true; setTimeout(()=>{copyButton.textContent=oT;copyButton.disabled=false;},1500);}});
clearButton.addEventListener('click',()=>{inputText.value=''; outputArea.textContent='Aguardando entrada...'; outputArea.classList.remove('error-message','loading-message'); lastRawResult=''; parsedResults=null; gasoButton.disabled=true; gasoButton.style.backgroundColor='#6c757d'; gasoOutputArea.style.display='none';});
pasteButton.addEventListener('click',async()=>{if(!navigator.clipboard||!navigator.clipboard.readText){alert('Navegador não suporta ou página não segura.'); return;} try{const cT=await navigator.clipboard.readText(); if(cT){inputText.value=cT; const oT=pasteButton.textContent; const oB=pasteButton.style.backgroundColor; const oC=pasteButton.style.color; pasteButton.textContent='Transferido!'; pasteButton.style.backgroundColor='#28a745'; pasteButton.style.color='white'; pasteButton.disabled=true; setTimeout(()=>{pasteButton.textContent=oT;pasteButton.style.backgroundColor=oB;pasteButton.style.color=oC;pasteButton.disabled=false;},1500);}else{const oT=pasteButton.textContent; pasteButton.textContent='Área de Transferência Vazia!'; pasteButton.disabled=true; setTimeout(()=>{pasteButton.textContent=oT;pasteButton.disabled=false;},1500);}}catch(err){console.error('Erro ao colar:',err); alert('Erro ao ler área de transferência. Verifique permissões.');}});

// --- Event Listener para o botão Interpretar Gasometria ---
gasoButton.addEventListener('click', () => {
    const interpretation = interpretarGasometria(); // Chama a função

    // --- DEBUGGING ---
    // console.log("DEBUG: String retornada por interpretarGasometria():", interpretation); // <<< REMOVER ESTA LINHA
    // alert("DEBUG: Resultado da Interpretação:\n\n" + interpretation); // <<< REMOVER ESTA LINHA
    // --- FIM DEBUGGING ---

    gasoOutputArea.textContent = interpretation; // Atribui ao output
    gasoOutputArea.style.display = 'block'; // Mostra a área
    gasoOutputArea.classList.remove('error-message'); // Limpa erro anterior da área de gaso
    if (interpretation.startsWith("Erro:")) {
        gasoOutputArea.classList.add('error-message'); // Adiciona classe de erro se a interpretação falhar
    }
});
