import { CartItem, CartState } from "../types";
import { calculateSelicReturns } from "../utils/selicCalculator";

// Declare global variables for mouse position
declare global {
  interface Window {
    mouseX: number;
    mouseY: number;
  }
}

// Cache de elementos processados
const processedElements = new Set<Element>();

// Para rastrear o estado da tecla Alt
let isAltPressed = false;
// Para rastrear a posição do mouse
window.mouseX = 0;
window.mouseY = 0;
// Para throttle de eventos de mouse
let mouseMoveTimeout: ReturnType<typeof setTimeout> | null = null;
// Para gerenciar o timeout do toast
let toastTimeout: number | null = null;
// Elemento de preço atualmente sob hover
let currentHoveredPrice: { element: HTMLElement; price: number } | null = null;
// Estado atual do carrinho
let currentCartState: CartState | null = null;
// Flag para controlar se os preços já foram processados
let pricesProcessed = false;

/**
 * Verificar se um texto contém um preço válido
 */
function containsValidPrice(text: string): boolean {
  // Remove espaços extras, quebras de linha e limpa caracteres especiais
  const cleanText = text
    .replace(/\s+/g, " ")
    .replace(/&nbsp;|&#160;|\u00A0/g, " ")
    .trim();

  // Padrões de preço comuns em sites brasileiros
  const pricePatterns = [
    // Formato padrão: R$ X.XXX,XX ou R$ X,XX
    /R\$\s*\d+(?:\.\d{3})*(?:,\d{2})?/,
    // Formato com vírgula: R$ X,XXX.XX
    /R\$\s*\d+(?:,\d{3})*(?:\.\d{2})?/,
    // Formato sem centavos: R$ X.XXX ou R$ X
    /R\$\s*\d+(?:\.\d{3})*/,
    // Formato Amazon (separado em partes)
    /R\$\s*\d+(?:\.\d{3})*(?:,\d{2}|\s*,\d{2})?/,
    // Formato Apple (sem pontuação)
    /R\$\s*\d+/,
  ];

  return pricePatterns.some((pattern) => pattern.test(cleanText));
}

/**
 * Encontrar o elemento pai mais próximo que contém o preço completo
 */
function findPriceContainer(element: Node): HTMLElement | null {
  let current = element.parentElement;
  const maxDepth = 5;
  let depth = 0;

  while (current && depth < maxDepth) {
    // Verifica se é um container de preço da Amazon
    if (isAmazonPriceContainer(current)) {
      return current as HTMLElement;
    }

    // Verifica o formato padrão
    const text = current.textContent || "";
    if (containsValidPrice(text)) {
      return current as HTMLElement;
    }

    current = current.parentElement;
    depth++;
  }

  return null;
}

/**
 * Verifica se é um container de preço da Amazon
 */
function isAmazonPriceContainer(element: Element): boolean {
  // Verifica se tem os elementos característicos da Amazon
  const hasSymbol = element.querySelector(".a-price-symbol") !== null;
  const hasWhole = element.querySelector(".a-price-whole") !== null;
  const hasFraction = element.querySelector(".a-price-fraction") !== null;

  // Verifica se tem a classe a-price ou tem os elementos característicos
  const isAPrice = element.classList.contains("a-price");

  return isAPrice || (hasSymbol && (hasWhole || hasFraction));
}

/**
 * Extrai preço no formato da Amazon
 */
function extractAmazonPrice(element: Element): number | null {
  try {
    const wholeElement = element.querySelector(".a-price-whole");
    const fractionElement = element.querySelector(".a-price-fraction");

    if (!wholeElement) return null;

    // Limpa caracteres especiais e não numéricos do texto do preço
    let wholeText = wholeElement.textContent || "";

    // Remove aspas e caracteres não numéricos, incluindo literais como "&nbsp;"
    wholeText = wholeText.replace(/"/g, ""); // Remove aspas
    wholeText = wholeText.replace(/&nbsp;|&#160;|\u00A0/g, ""); // Remove nbsp literal ou caractere
    const cleanWholeText = wholeText.replace(/\D/g, "");

    const whole = cleanWholeText || "0";
    const fraction = fractionElement?.textContent?.replace(/\D/g, "") || "00";

    const priceStr = `${whole}.${fraction}`;
    const price = parseFloat(priceStr);

    return isNaN(price) ? null : price;
  } catch (error) {
    console.error("Error extracting Amazon price:", error);
    return null;
  }
}

/**
 * Extrai preço do texto com suporte a vários formatos brasileiros
 */
function extractPriceFromText(text: string | Element): number | null {
  try {
    // Se for um elemento HTML, verifica se é um container de preço da Amazon
    if (text instanceof Element) {
      const amazonPrice = extractAmazonPrice(text);
      if (amazonPrice !== null) {
        return amazonPrice;
      }
      text = text.textContent || "";
    }

    // Limpar o texto
    const cleanText = text
      .replace(/\s+/g, " ")
      .replace(/&nbsp;|&#160;|\u00A0/g, " ")
      .trim();

    // Vários formatos possíveis de preço no Brasil
    const pricePatterns = [
      // Formato comum: R$ 1.999,99
      /R\$\s*(\d+(?:\.\d{3})*,\d{2})/,

      // Formato sem pontos de milhar: R$ 1999,99
      /R\$\s*(\d+,\d{2})/,

      // Formato sem centavos: R$ 1.999
      /R\$\s*(\d+(?:\.\d{3})*)/,

      // Formato sem centavos e sem milhar: R$ 1999
      /R\$\s*(\d+)/,

      // Formato Amazon (preço separado em partes)
      /R\$\s*(\d+)[\s\n\r]*(?:[.,][\s\n\r]*(\d{2}))?/,

      // Formato genérico
      /R\$\s*(\d+(?:[.,]\d{3})*(?:[.,]\d{2})?)/,
    ];

    // Encontra o preço no texto usando os padrões
    for (const pattern of pricePatterns) {
      const match = cleanText.match(pattern);
      if (match) {
        // Amazon: pode ter preço separado em partes
        if (match[2]) {
          // Formato: R$ 1.999 + ,99 separado
          return parseFloat(`${match[1].replace(".", "")}.${match[2]}`);
        }

        // Formato normal
        let priceStr = match[1];
        // Converter para o formato decimal (ponto como separador decimal)
        priceStr = priceStr.replace(/\./g, "").replace(",", ".");

        const price = parseFloat(priceStr);
        if (!isNaN(price)) {
          return price;
        }
      }
    }

    return null;
  } catch (error) {
    console.error("Error extracting price:", error);
    return null;
  }
}

/**
 * Criar o toast/popup que será exibido ao pressionar Alt sobre um preço
 */
function createToast(): HTMLElement {
  const existingToast = document.getElementById("selic-saver-tooltip");
  if (existingToast) return existingToast as HTMLElement;

  const toast = document.createElement("div");
  toast.id = "selic-saver-tooltip";
  toast.style.cssText = `
    position: fixed;
    background: rgba(33, 33, 33, 0.95);
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
    font-size: 13px;
    line-height: 1.5;
    z-index: 9999999;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease, transform 0.2s ease;
    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
    max-width: 280px;
    border: 1px solid rgba(255,255,255,0.1);
    transform: translateY(8px);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  `;

  document.body.appendChild(toast);

  return toast;
}

/**
 * Mostrar o toast com os cálculos da Selic para o preço
 */
function showToast(element: HTMLElement, price: number): void {
  try {
    // Verifique se o toast existe, caso contrário, crie-o
    let toast = document.getElementById("selic-saver-tooltip") as HTMLElement;
    if (!toast) {
      toast = createToast();
    }

    if (!toast) {
      console.error("Não foi possível criar o toast");
      return;
    }

    if (toastTimeout) {
      window.clearTimeout(toastTimeout);
      toastTimeout = null;
    }

    // Calcular os rendimentos
    const calculation = calculateSelicReturns(price);

    // Formatar valores
    const formatCurrency = (value: number): string => {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value);
    };

    // Atualizar conteúdo
    toast.innerHTML = `
      <div style="margin-bottom: 8px; font-weight: bold;">Rendimento na Selic</div>
      <div style="margin: 4px 0; display: flex; justify-content: space-between;">
        <span>Valor atual:</span>
        <span>${formatCurrency(price)}</span>
      </div>
      <div style="margin: 4px 0; display: flex; justify-content: space-between;">
        <span>1 mês:</span>
        <span>${formatCurrency(
          price + calculation.oneMonth
        )} <small style="color: #4CAF50">(+${formatCurrency(
      calculation.oneMonth
    )})</small></span>
      </div>
      <div style="margin: 4px 0; display: flex; justify-content: space-between;">
        <span>6 meses:</span>
        <span>${formatCurrency(
          price + calculation.sixMonths
        )} <small style="color: #4CAF50">(+${formatCurrency(
      calculation.sixMonths
    )})</small></span>
      </div>
      <div style="margin: 4px 0; display: flex; justify-content: space-between;">
        <span>1 ano:</span>
        <span>${formatCurrency(
          price + calculation.oneYear
        )} <small style="color: #4CAF50">(+${formatCurrency(
      calculation.oneYear
    )})</small></span>
      </div>
    `;

    // Posicionamento relativo ao preço
    const elementRect = element.getBoundingClientRect();

    // Prefere mostrar à direita do elemento
    toast.style.left = `${elementRect.right + window.scrollX + 10}px`;
    toast.style.top = `${elementRect.top + window.scrollY}px`;

    // Forçar visualização para poder medir
    toast.style.display = "block";
    toast.style.opacity = "1";

    // Reposicionar se necessário para evitar sair da tela
    setTimeout(() => {
      const toastRect = toast.getBoundingClientRect();

      // Se estiver saindo pela direita, coloca à esquerda
      if (toastRect.right > window.innerWidth) {
        toast.style.left = `${
          elementRect.left + window.scrollX - toastRect.width - 10
        }px`;
      }

      // Se estiver saindo por baixo, ajusta para cima
      if (toastRect.bottom > window.innerHeight) {
        toast.style.top = `${
          elementRect.top +
          window.scrollY -
          (toastRect.bottom - window.innerHeight) -
          10
        }px`;
      }

      // Ultimo recurso: posiciona próximo ao mouse
      if (toastRect.top < 0 || parseFloat(toast.style.left) < 0) {
        toast.style.left = `${window.mouseX + window.scrollX + 15}px`;
        toast.style.top = `${window.mouseY + window.scrollY - 10}px`;
      }
    }, 50);

    // Animação
    toast.style.transform = "translateY(8px)";
    setTimeout(() => {
      toast.style.transform = "translateY(0)";
    }, 10);
  } catch (error) {
    console.error("Error showing toast:", error);
  }
}

/**
 * Esconder o toast
 */
function hideToast(): void {
  if (toastTimeout) {
    window.clearTimeout(toastTimeout);
  }

  toastTimeout = window.setTimeout(() => {
    const toast = document.getElementById("selic-saver-tooltip") as HTMLElement;
    if (toast) {
      toast.style.opacity = "0";
    }
    toastTimeout = null;
  }, 100);
}

/**
 * Exibir o indicador "Pressione Alt" quando o mouse estiver sobre um preço
 * Função vazia - removido o indicador de texto
 */
function showSelicIndicator(x: number, y: number): void {
  // Função vazia - removido o indicador "Pressione Alt"
}

/**
 * Esconder o indicador
 * Função vazia - removido o indicador de texto
 */
function hideSelicIndicator(): void {
  // Função vazia - removido o indicador "Pressione Alt"
}

/**
 * Forçar a exibição do toast para qualquer preço detectado próximo ao mouse
 */
function forceShowToastForAnyPrice(): boolean {
  try {
    console.log("Buscando elementos com R$ próximos ao mouse");
    // Tenta encontrar qualquer elemento visível com texto que contém R$
    const allElements = document.querySelectorAll("*");

    // Para não sobrecarregar, limita a verificação a elementos próximos ao mouse
    const mouseX = window.mouseX || 0;
    const mouseY = window.mouseY || 0;

    // Armazena o melhor resultado encontrado
    let bestMatch = {
      element: null as HTMLElement | null,
      price: 0,
      distance: Infinity,
    };

    for (const element of allElements) {
      try {
        if (!(element instanceof HTMLElement)) continue;

        // Pula elementos não visíveis ou muito pequenos
        const rect = element.getBoundingClientRect();
        if (rect.width < 5 || rect.height < 5) continue;

        // Calcula a distância do mouse ao centro do elemento
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distance = Math.sqrt(
          Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2)
        );

        // Limita a uma distância razoável
        if (distance > 150) continue;

        const text = element.textContent || "";
        if (text.includes("R$")) {
          // Tenta extrair o preço
          const price = extractPriceFromText(text);
          if (price !== null && price > 0) {
            console.log(
              `Encontrado: R$ ${price} (distância: ${distance.toFixed(2)}px)`
            );

            // Guarda o elemento mais próximo do mouse que tem um preço válido
            if (distance < bestMatch.distance) {
              bestMatch = {
                element: element,
                price: price,
                distance: distance,
              };
            }
          }
        }
      } catch (error) {
        // Ignora erros em elementos individuais
        continue;
      }
    }

    // Se encontrou um resultado, exibe o toast para ele
    if (bestMatch.element && bestMatch.price > 0) {
      console.log(
        "MELHOR MATCH encontrado:",
        bestMatch.element,
        `R$ ${bestMatch.price}`,
        `Distância: ${bestMatch.distance.toFixed(2)}px`
      );
      showToast(bestMatch.element, bestMatch.price);
      return true;
    }

    return false;
  } catch (error) {
    console.error("Erro ao forçar exibição do toast:", error);
    return false;
  }
}

/**
 * Processa o elemento sob o cursor
 */
function processElementUnderCursor(): void {
  try {
    // Tenta encontrar o elemento que está sob o cursor
    const hoveredElement = document.elementFromPoint(
      window.mouseX || 0,
      window.mouseY || 0
    );

    if (!hoveredElement) {
      return;
    }

    // Se já temos um preço no hover atual, mostre o toast
    if (currentHoveredPrice) {
      showToast(currentHoveredPrice.element, currentHoveredPrice.price);
      return;
    }

    // Verificar se o elemento ou seus pais tem classes específicas de preço
    const priceSelectors = [
      ".price",
      ".product-price",
      ".price-value",
      ".a-price",
      ".a-offscreen",
      ".price__value",
      ".sales-price",
    ];

    for (const selector of priceSelectors) {
      if (hoveredElement.closest(selector)) {
        const priceElement = hoveredElement.closest(selector) as HTMLElement;
        const price = extractPriceFromText(priceElement);
        if (price !== null && price > 0) {
          showToast(priceElement, price);
          return;
        }
      }
    }

    // Segundo passo: verificar se contém R$ no texto
    let element: Element | null = hoveredElement;
    let depth = 0;
    const maxDepth = 5;

    while (element && depth < maxDepth) {
      const text = element.textContent || "";
      if (text.includes("R$")) {
        const price = extractPriceFromText(text);
        if (price !== null && price > 0) {
          showToast(element as HTMLElement, price);
          return;
        }
      }
      element = element.parentElement;
      depth++;
    }

    // Terceiro passo: verificar todos os elementos próximos
    const elements = document.elementsFromPoint(
      window.mouseX || 0,
      window.mouseY || 0
    );
    for (const elem of elements) {
      const text = elem.textContent || "";
      if (text.includes("R$")) {
        const price = extractPriceFromText(text);
        if (price !== null && price > 0) {
          showToast(elem as HTMLElement, price);
          return;
        }
      }
    }

    // Último recurso: força busca em toda a página
    forceShowToastForAnyPrice();
  } catch (error) {
    console.error("Error processing element under cursor:", error);
  }
}

/**
 * Registra um elemento de preço com listeners
 */
function registerPriceElement(element: HTMLElement, price: number): void {
  if (!processedElements.has(element)) {
    // Adiciona os event listeners
    element.addEventListener("mouseenter", () => {
      currentHoveredPrice = { element, price };

      if (isAltPressed) {
        showToast(element, price);
      }
    });

    element.addEventListener("mouseleave", () => {
      currentHoveredPrice = null;
    });

    // Marca como processado
    processedElements.add(element);
  }
}

/**
 * Update the cart state and notify the background script
 */
function updateCartState(): void {
  const items = extractPricesFromPage();
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const cartState: CartState = {
    items,
    total,
    selicCalculation: calculateSelicReturns(total),
  };

  currentCartState = cartState;

  // Send updated cart to background script
  chrome.runtime.sendMessage({
    type: "CART_UPDATE",
    payload: cartState,
  });
}

/**
 * Simplified price extraction - in a real extension,
 * this would be more sophisticated based on website structure
 */
function extractPricesFromPage(): CartItem[] {
  // This is a simplified implementation
  // In a real extension, this would use more complex selectors
  // specific to each supported e-commerce site

  const priceElements = document.querySelectorAll(
    "[data-price], .price, .product-price, .cart-price, .a-price, .a-offscreen"
  );
  const items: CartItem[] = [];

  priceElements.forEach((element, index) => {
    const price = extractPriceFromText(element);

    if (price !== null && price > 0) {
      // Default to product name or "Item {index}" if name can't be extracted
      let name = "Item " + (index + 1);

      // Try to find a product name near the price element
      const possibleNameElement = element
        .closest("[data-product], .product, .product-name, .product-title")
        ?.querySelector("h1, h2, h3, .name, .product-title, .product-name");

      if (possibleNameElement) {
        name = possibleNameElement.textContent?.trim() || name;
      }

      items.push({
        name,
        price,
        quantity: 1,
      });

      // Também registra o elemento para interação com Alt
      registerPriceElement(element as HTMLElement, price);
    }
  });

  return items;
}

// Detectar tecla Alt e outros eventos
document.addEventListener("keydown", (e) => {
  if (e.key === "Alt") {
    isAltPressed = true;
    hideSelicIndicator(); // Esconder o indicador

    console.log("Alt pressionado - detectando preços");
    processElementUnderCursor();
  }
});

document.addEventListener("keyup", (e) => {
  if (e.key === "Alt") {
    isAltPressed = false;
    hideToast();
  }
});

document.addEventListener("mousemove", (e) => {
  window.mouseX = e.clientX;
  window.mouseY = e.clientY;

  // Se Alt estiver pressionada, atualizar o popup
  if (isAltPressed) {
    processElementUnderCursor();
  } else {
    // Senão, verificar se deve mostrar o indicador
    // Usamos throttle para não verificar a cada movimento do mouse
    if (!mouseMoveTimeout) {
      mouseMoveTimeout = setTimeout(() => {
        const price = findPriceNearMouse();
        if (price !== null && price > 0) {
          showSelicIndicator(window.mouseX, window.mouseY);
        } else {
          hideSelicIndicator();
        }
        mouseMoveTimeout = null;
      }, 150);
    }
  }
});

// Find price near mouse position
function findPriceNearMouse(): number | null {
  try {
    // Find element under cursor
    const element = document.elementFromPoint(window.mouseX, window.mouseY);
    if (!element) return null;

    // First check if the element or its parents have price-related classes
    const priceSelectors = [
      ".price",
      ".product-price",
      ".price-value",
      ".price__value",
      ".price-current",
      ".a-price",
      ".a-price-whole",
      ".a-offscreen",
      ".andes-money-amount",
      ".price-tag",
      ".product-price-value",
      ".main-price",
    ];

    for (const selector of priceSelectors) {
      const priceElement = element.closest(selector);
      if (priceElement) {
        const price = extractPriceFromText(priceElement);
        if (price !== null && price > 0) return price;
      }
    }

    // Check if the element or its parents contain R$
    let current = element;
    let depth = 0;
    const maxDepth = 5;

    while (current && depth < maxDepth) {
      const text = current.textContent || "";
      if (text.includes("R$")) {
        const price = extractPriceFromText(text);
        if (price !== null && price > 0) return price;
      }

      current = current.parentElement as Element;
      depth++;
    }

    // Last resort: check all elements at mouse position
    const elements = document.elementsFromPoint(window.mouseX, window.mouseY);
    for (const elem of elements) {
      if (elem === element) continue; // Skip already checked element

      const text = elem.textContent || "";
      if (text.includes("R$")) {
        const price = extractPriceFromText(text);
        if (price !== null && price > 0) return price;
      }
    }

    return null;
  } catch (error) {
    console.error("Error finding price near mouse:", error);
    return null;
  }
}

// Initialize
function init(): void {
  console.log("Selic Saver content script initialized");

  // Create toast container now
  createToast();

  // Initial scan for prices
  setTimeout(() => {
    updateCartState();
    pricesProcessed = true;
  }, 1000);

  // Set up mutation observer to detect DOM changes
  const observer = new MutationObserver(() => {
    // Debounce the updates to avoid too many calculations
    if (observer.timeout) {
      clearTimeout(observer.timeout);
    }

    observer.timeout = setTimeout(updateCartState, 500);
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["class", "style"],
  });
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// Add timeout property to MutationObserver type
declare global {
  interface MutationObserver {
    timeout?: ReturnType<typeof setTimeout>;
  }
}
