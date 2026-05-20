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
            window.pixCodeText = data.qr_code || data.qrcode;
            
            let qrBase64 = data.qr_code_base64 || data.qrcode_base64;
            if (qrBase64 && qrBase64.startsWith('data:image')) {
                document.getElementById('pix-qr-image').src = qrBase64;
            } else {
                document.getElementById('pix-qr-image').src = 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(window.pixCodeText);
            }
            
            document.getElementById('pix-qr-text').innerText = window.pixCodeText;
            
            document.getElementById('pix-step-cpf').style.display = 'none';
            document.getElementById('pix-step-code').style.display = 'block';
            
            let sheet = document.querySelector('.pix-bottom-sheet');
            if(sheet) sheet.scrollTop = 0;
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
    #pix-fullscreen-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 999999; display: flex; align-items: flex-end; justify-content: center; font-family: 'Inter', Arial, sans-serif; backdrop-filter: blur(2px); }
    .pix-bottom-sheet { width: 100%; max-width: 600px; background: white; border-radius: 24px 24px 0 0; max-height: 95vh; overflow-y: auto; animation: slideUp 0.3s ease-out; box-shadow: 0 -4px 10px rgba(0,0,0,0.1); position: relative; padding-bottom: 24px; }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    .pix-drag-handle { width: 40px; height: 5px; background: #e5e7eb; border-radius: 3px; margin: 12px auto 20px auto; }
    .pix-close { position: absolute; top: 10px; right: 15px; background: none; border: none; font-size: 28px; cursor: pointer; color: #9ca3af; padding: 5px; line-height: 1; }
    .pix-container { padding: 0 24px; }
    .cpf-title { font-size: 18px; font-weight: bold; color: #111827; margin-bottom: 5px; display: flex; align-items: center; gap: 8px; }
    .cpf-title i { color: #f59e0b; }
    .cpf-subtitle { font-size: 13px; color: #6b7280; margin-bottom: 20px; line-height: 1.4; }
    .pix-alert-green { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 12px; border-radius: 8px; font-size: 13px; margin-bottom: 20px; display: flex; gap: 10px; align-items: flex-start; line-height: 1.4; }
    .cpf-input-box { border: 1px solid #d1d5db; border-radius: 8px; padding: 16px; width: 100%; font-size: 16px; margin-bottom: 20px; box-sizing: border-box; outline: none; transition: border-color 0.2s; color: #111827; }
    .cpf-input-box:focus { border-color: #16a34a; }
    .cpf-input-box::placeholder { color: #9ca3af; }
    .pix-btn { background: #16a34a; color: white; border: none; border-radius: 8px; padding: 16px; width: 100%; font-size: 16px; font-weight: bold; cursor: pointer; display: flex; justify-content: center; align-items: center; gap: 8px; transition: background 0.2s; }
    .pix-btn:hover { background: #15803d; }
    .pix-btn:disabled { background: #9ca3af; cursor: not-allowed; opacity: 0.7; }
    </style>
    `;

    let html = `
    <div id="pix-fullscreen-overlay" onclick="if(event.target === this) fecharPixUI()">
        ${style}
        <div class="pix-bottom-sheet">
            <button class="pix-close" onclick="fecharPixUI()">×</button>
            <div class="pix-drag-handle"></div>
            
            <div class="pix-container" id="pix-step-cpf">
                <div class="cpf-title">
                    <i class="fa-solid fa-address-card"></i> Informe seu CPF
                </div>
                <div class="cpf-subtitle">
                    Necessário para processar o pagamento via PIX e emitir nota fiscal.
                </div>
                <div class="pix-alert-green">
                    <i class="fa-solid fa-shield-halved" style="margin-top: 2px;"></i> 
                    <div>Seus dados são protegidos e criptografados e serão utilizados somente para finalizar seu pedido.</div>
                </div>
                <input type="tel" id="pix-cpf-input" class="cpf-input-box" placeholder="000.000.000-00" autocomplete="off">
                <button class="pix-btn" id="pix-btn-gerar" onclick="gerarPixAPI()">
                    <i class="fa-solid fa-lock"></i> Salvar e pagar
                </button>
            </div>

            <div class="pix-container" id="pix-step-code" style="display: none;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: #dcfce7; border-radius: 50%; color: #16a34a; font-size: 24px; margin-bottom: 10px;">
                        <i class="fa-solid fa-check"></i>
                    </div>
                    <h2 style="font-size: 20px; font-weight: bold; color: #111827; margin: 0;">Pedido reservado</h2>
                    <p style="font-size: 14px; color: #6b7280; margin-top: 5px;">Seu pedido está seguro e garantido.</p>
                </div>

                <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; margin-bottom: 20px; display: flex; gap: 10px; align-items: flex-start; font-size: 13px; color: #92400e; line-height: 1.4;">
                    <i class="fa-solid fa-triangle-exclamation" style="margin-top:2px;"></i>
                    <div>Alguns bancos exibem alertas de segurança automáticos em compras online. Isso é normal e não afeta o seu pedido.</div>
                </div>

                <div style="text-align: center; margin-bottom: 20px;">
                    <img id="pix-qr-image" src="" alt="QR Code PIX" style="width: 200px; height: 200px; border-radius: 8px; border: 1px solid #e5e7eb; padding: 5px;">
                </div>
                
                <div style="background: #f3f4f6; border: 1px dashed #d1d5db; padding: 15px; border-radius: 8px; font-size: 13px; word-break: break-all; margin-bottom: 15px; color: #6b7280; text-align: center; cursor: pointer; user-select: all;" id="pix-qr-text" onclick="copiarPixNovo()"></div>
                
                <button class="pix-btn" onclick="copiarPixNovo()" style="margin-bottom: 20px;">
                    <i class="fa-regular fa-copy"></i> Copiar código PIX
                </button>
                
                <div style="background: #f9fafb; border-radius: 8px; padding: 15px; margin-bottom: 24px; border: 1px solid #f3f4f6;">
                    <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px; padding-bottom: 15px;">
                        <i class="fa-solid fa-hourglass-half" style="font-size: 24px; color: #f59e0b;"></i>
                        <div>
                            <strong style="display: block; color: #111827; font-size: 15px;">Aguardando pagamento...</strong>
                            <span style="font-size: 13px; color: #6b7280;">Verificando automaticamente</span>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h3 style="font-size: 16px; font-weight: bold; color: #111827; margin-bottom: 15px;">Como pagar</h3>
                    <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                        <div style="width: 24px; height: 24px; background: #dcfce7; color: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; flex-shrink: 0;">1</div>
                        <div style="font-size: 13px; color: #4b5563; line-height: 1.4;">
                            <strong style="display: block; color: #111827; font-size: 14px; margin-bottom: 2px;">Copie o código</strong>
                            Clique no botão verde "Copiar código PIX" acima.
                        </div>
                    </div>
                    <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                        <div style="width: 24px; height: 24px; background: #dcfce7; color: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; flex-shrink: 0;">2</div>
                        <div style="font-size: 13px; color: #4b5563; line-height: 1.4;">
                            <strong style="display: block; color: #111827; font-size: 14px; margin-bottom: 2px;">Abra o app do seu banco</strong>
                            Vá na área PIX e selecione a opção "Pix Copia e Cola".
                        </div>
                    </div>
                    <div style="display: flex; gap: 15px; margin-bottom: 15px;">
                        <div style="width: 24px; height: 24px; background: #dcfce7; color: #16a34a; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; flex-shrink: 0;">3</div>
                        <div style="font-size: 13px; color: #4b5563; line-height: 1.4;">
                            <strong style="display: block; color: #111827; font-size: 14px; margin-bottom: 2px;">Confirme os dados</strong>
                            Verifique se o recebedor é <b>COMPRA GARANTIDA BR LTDA</b> e confirme.
                        </div>
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
