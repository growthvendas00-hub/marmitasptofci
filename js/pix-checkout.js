window.pixCodeText = "";
window.pixReference = "";

function fecharPixUI() {
    let el = document.getElementById('pix-fullscreen-overlay');
    if (el) el.remove();
}

function copiarPixNovo() {
    navigator.clipboard.writeText(window.pixCodeText).then(() => {
        Swal.fire({
            icon: 'success', title: 'Copiado!', text: 'Código PIX copiado com sucesso.', timer: 2000, showConfirmButton: false
        });
    });
}

function chamarZap() {
    let textUrl = encodeURIComponent("Oi, fiz o pagamento do pedido " + window.pixReference + ". Aqui está o comprovante!");
    window.location.href = "https://wa.me/5511999999999?text=" + textUrl;
}

async function gerarPixAPI() {
    let cpfInput = document.getElementById('pix-cpf-input');
    let cpf = cpfInput.value.replace(/\D/g, '');
    if (cpf.length !== 11) {
        Swal.fire('Atenção', 'Por favor, digite um CPF válido.', 'warning');
        return;
    }
    
    let btn = document.getElementById('pix-btn-gerar');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Gerando PIX...';
    btn.disabled = true;

    let description = document.querySelector('.descricao h3').innerText.trim();
    let rawPrice = document.querySelector('.descricao .preco').innerText;
    let priceMatch = rawPrice.match(/\d+,\d{2}/);
    let amount = priceMatch ? parseInt(priceMatch[0].replace(',', '')) : 2390;

    let getCookie = (cname) => {
        let name = cname + "=";
        let ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1);
            if (c.indexOf(name) == 0) return decodeURIComponent(c.substring(name.length, c.length));
        }
        return "";
    };

    let customerNome = getCookie("nomeCliente") || "";
    let customerPhone = getCookie("telCliente") || "";
    window.pixReference = "PED-" + Math.floor(Math.random() * 1000000);

    try {
        let response = await fetch('/api/pix', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, description, reference: window.pixReference, customerNome, customerPhone, customerDocument: cpf })
        });

        let data = await response.json();

        if (response.ok && data.status === 'success') {
            window.pixCodeText = data.qr_code;
            document.getElementById('pix-qr-image').src = data.qr_code_base64;
            document.getElementById('pix-qr-text').innerText = data.qr_code;
            
            document.getElementById('pix-step-cpf').style.display = 'none';
            document.getElementById('pix-header-title').innerText = 'Pagamento via PIX';
            document.getElementById('pix-step-code').style.display = 'block';
        } else {
            Swal.fire("Erro", "Não foi possível gerar o PIX: " + (data.error || data.message || "Erro desconhecido"), "error");
            btn.innerHTML = '<i class="fa-solid fa-lock"></i> Salvar e pagar';
            btn.disabled = false;
        }
    } catch (err) {
        Swal.fire("Erro", "Ocorreu um erro de conexão: " + err.message, "error");
        btn.innerHTML = '<i class="fa-solid fa-lock"></i> Salvar e pagar';
        btn.disabled = false;
    }
}

async function iniciarPixUI() {
    let { isConfirmed, isDenied } = await Swal.fire({
        title: "Deseja que entreguemos agora?",
        showDenyButton: true,
        showCancelButton: true,
        cancelButtonText: "Cancelar",
        allowOutsideClick: false,
        icon: 'question',
        confirmButtonText: "Sim, por favor!",
        confirmButtonColor: "#16a34a",
        denyButtonText: `Agendar entrega`,
        focusConfirm: true,
    });

    if (!isConfirmed && !isDenied) return;

    if (isDenied) {
        let resultTime = await Swal.fire({
            title: "Selecione o dia e a hora, por gentileza!",
            text: 'Deixe seu pedido agendado e receba na hora combinada.',
            confirmButtonText: "Agendar pedido!",
            confirmButtonColor: "#16a34a",
            showCancelButton: true,
            cancelButtonText: "Voltar",
            allowOutsideClick: false,
            input: "datetime-local",
        });
        if (!resultTime.value) return;
    }

    if (document.getElementById('pix-fullscreen-overlay')) {
        document.getElementById('pix-fullscreen-overlay').remove();
    }

    let style = `
    <style>
    #pix-fullscreen-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #f3f4f6; z-index: 999999; overflow-y: auto; font-family: 'Inter', Arial, sans-serif; }
    .pix-header { background: white; padding: 15px; text-align: center; border-bottom: 1px solid #e5e7eb; font-weight: bold; font-size: 18px; display: flex; justify-content: space-between; align-items: center; }
    .pix-close { background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; }
    .pix-container { padding: 15px; max-width: 500px; margin: 0 auto; padding-bottom: 40px; }
    .pix-card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); margin-bottom: 15px; }
    .cpf-input-box { border: 1px solid #d1d5db; border-radius: 8px; padding: 15px; width: 100%; font-size: 18px; margin-bottom: 15px; box-sizing: border-box; text-align: center; font-weight: bold; }
    .pix-btn { background: #16a34a; color: white; border: none; border-radius: 8px; padding: 15px; width: 100%; font-size: 16px; font-weight: bold; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; }
    .pix-btn:disabled { background: #9ca3af; }
    .pix-warning { background: #fef3c7; border: 1px solid #fde68a; color: #92400e; padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 20px; display: flex; gap: 10px; align-items: flex-start; }
    .pix-qr-container { text-align: center; margin-bottom: 20px; }
    .pix-qr-container img { width: 220px; height: 220px; border-radius: 8px; }
    .pix-copy-box { background: #f3f4f6; border: 1px dashed #d1d5db; padding: 12px; border-radius: 8px; font-size: 11px; word-break: break-all; margin-bottom: 15px; color: #6b7280; text-align: center; user-select: all; }
    .step-circle { width: 24px; height: 24px; background: #16a34a; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; flex-shrink: 0; }
    .step-row { display: flex; gap: 12px; margin-bottom: 15px; align-items: flex-start; }
    .step-text { font-size: 13px; color: #374151; }
    .step-text strong { display: block; color: #111827; margin-bottom: 2px; font-size: 14px; }
    </style>
    `;

    let html = `
    <div id="pix-fullscreen-overlay">
        ${style}
        <div class="pix-header">
            <span style="width: 24px;"></span>
            <span id="pix-header-title">Pagamento</span>
            <button class="pix-close" onclick="fecharPixUI()">×</button>
        </div>
        
        <div class="pix-container" id="pix-step-cpf">
            <div class="pix-card">
                <div style="display: flex; align-items: center; gap: 10px; color: #16a34a; font-weight: bold; font-size: 18px; margin-bottom: 15px;">
                    <i class="fa-regular fa-address-card"></i> Informe seu CPF
                </div>
                <p style="font-size: 14px; color: #6b7280; margin-bottom: 15px;">
                    Necessário para processar o pagamento via PIX e emitir nota fiscal.
                </p>
                <div class="pix-warning" style="background: #ecfdf5; border-color: #a7f3d0; color: #065f46;">
                    <i class="fa-solid fa-shield-halved"></i> 
                    <div>Seus dados são protegidos e criptografados e serão utilizados somente para finalizar seu pedido.</div>
                </div>
                <input type="tel" id="pix-cpf-input" class="cpf-input-box" placeholder="000.000.000-00" autocomplete="off">
                <button class="pix-btn" id="pix-btn-gerar" onclick="gerarPixAPI()">
                    <i class="fa-solid fa-lock"></i> Salvar e pagar
                </button>
            </div>
        </div>

        <div class="pix-container" id="pix-step-code" style="display: none;">
            <div class="pix-card">
                <div style="display:flex; align-items:center; gap:10px; color:#16a34a; font-weight:bold; margin-bottom: 15px; font-size: 16px;">
                    <i class="fa-solid fa-circle-check"></i> Pedido reservado
                </div>
                <div class="pix-warning">
                    <i class="fa-solid fa-triangle-exclamation" style="margin-top:2px;"></i>
                    <div>Alguns bancos exibem alertas de segurança automáticos em compras online. Isso é completamente normal e não afeta seu pedido.</div>
                </div>
                <p style="text-align:center; font-size:13px; color:#4b5563; margin-bottom:15px;">
                    O recebedor é nossa instituição de pagamentos parceira. Seu pedido está seguro e garantido. ✅
                </p>
                
                <div class="pix-qr-container">
                    <img id="pix-qr-image" src="" alt="QR Code PIX">
                </div>
                
                <div class="pix-copy-box" id="pix-qr-text"></div>
                
                <button class="pix-btn" onclick="copiarPixNovo()">
                    <i class="fa-regular fa-copy"></i> Copiar código PIX
                </button>
                
                <p style="text-align:center; font-size:12px; color:#6b7280; margin-top:15px;">
                    Confira o nome do recebedor, ele deve ser:<br>
                    <strong style="color:#111827; display:block; margin-top:5px; font-size:13px;">FOGÃO BRAZUCA / PARADISEPAGS</strong>
                </p>
                
                <div style="display:flex; justify-content:center; gap:25px; margin-top:20px; font-size:13px; color:#16a34a; font-weight:bold; border-top: 1px solid #f3f4f6; padding-top: 15px;">
                    <span><i class="fa-solid fa-shield"></i> Pagamento protegido</span>
                    <span><i class="fa-solid fa-lock"></i> Ambiente seguro</span>
                </div>
            </div>
            
            <div class="pix-card" style="display:flex; align-items:center; gap:15px; background: #fffbeb; border: 1px solid #fde68a;">
                <i class="fa-solid fa-hourglass-half" style="font-size:24px; color:#f59e0b;"></i>
                <div>
                    <strong style="display:block; color:#111827;">Aguardando pagamento...</strong>
                    <span style="font-size:13px; color:#6b7280;">Verificando automaticamente</span>
                </div>
            </div>
            
            <div class="pix-card" style="display:flex; align-items:center; justify-content:space-between;">
                <div>
                    <strong style="display:block; color:#111827; margin-bottom:4px;">Dúvidas sobre seu pedido?</strong>
                    <span style="font-size:13px; color:#6b7280;">Fale com a gente pelo WhatsApp</span>
                </div>
                <button onclick="chamarZap()" style="background:#25d366; color:white; border:none; border-radius:20px; padding:8px 16px; font-weight:bold; cursor:pointer;">
                    <i class="fa-brands fa-whatsapp"></i> Chamar
                </button>
            </div>
            
            <div class="pix-card">
                <h3 style="font-size:16px; margin-bottom:20px; color:#111827;">Como realizar o pagamento</h3>
                
                <div class="step-row">
                    <div class="step-circle">1</div>
                    <div class="step-text">
                        <strong>Copie o código PIX acima</strong>
                        Clique no código ou no botão "Copiar código PIX"
                    </div>
                </div>
                
                <div class="step-row">
                    <div class="step-circle">2</div>
                    <div class="step-text">
                        <strong>Abra o app do seu banco</strong>
                        Vá em PIX → Pix Copia e Cola e cole o código
                    </div>
                </div>
                
                <div class="step-row">
                    <div class="step-circle">3</div>
                    <div class="step-text">
                        <strong>Confirme para FOGÃO BRAZUCA</strong>
                        Verifique o valor e finalize. Seu pedido é aprovado na hora.
                    </div>
                </div>
            </div>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
    
    if (typeof $ !== 'undefined' && $.fn.mask) {
        $('#pix-cpf-input').mask('000.000.000-00', {reverse: false});
    } else {
        document.getElementById('pix-cpf-input').addEventListener('input', function (e) {
            var x = e.target.value.replace(/\\D/g, '').match(/(\\d{0,3})(\\d{0,3})(\\d{0,3})(\\d{0,2})/);
            e.target.value = !x[2] ? x[1] : x[1] + '.' + x[2] + (x[3] ? '.' + x[3] : '') + (x[4] ? '-' + x[4] : '');
        });
    }
}
