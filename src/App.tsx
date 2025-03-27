import { useState, KeyboardEvent, MouseEvent, useEffect } from "react";
import { Button } from "./components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "./components/ui/dialog";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";
import { X } from "lucide-react";
import "./index.css";

function App() {
  const [masterKeys, setMasterKeys] = useState<string[]>(["Alt"]);
  const [isCapturing, setIsCapturing] = useState(false);

  // Load saved master keys from storage when component mounts
  useEffect(() => {
    chrome.storage.sync.get(["masterKeys"], (result) => {
      if (result.masterKeys) {
        setMasterKeys(result.masterKeys);
      }
    });
  }, []);

  // Save the master keys to storage when they change
  const saveMasterKeys = (keys: string[]) => {
    setMasterKeys(keys);
    chrome.storage.sync.set({ masterKeys: keys }, () => {
      console.log("Master keys saved:", keys);
      toast.success("Teclas de ativação salvas com sucesso!");
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!isCapturing) return;

    e.preventDefault();

    const key = e.key;

    // Handle capture of individual modifier keys
    if (
      key === "Control" ||
      key === "Alt" ||
      key === "Shift" ||
      key === "Meta"
    ) {
      // Map the key names to more user-friendly versions
      const keyMap: Record<string, string> = {
        Control: "Ctrl",
        Meta: "Cmd",
        Alt: "Alt",
        Shift: "Shift",
      };

      const friendlyKey = keyMap[key];

      if (!masterKeys.includes(friendlyKey)) {
        setMasterKeys([...masterKeys, friendlyKey]);
        toast.success(`Tecla "${friendlyKey}" adicionada`);
      }

      setIsCapturing(false);
      return;
    }

    // Handle combination of keys
    const modifiers: string[] = [];
    if (e.ctrlKey) modifiers.push("Ctrl");
    if (e.altKey) modifiers.push("Alt");
    if (e.shiftKey) modifiers.push("Shift");
    if (e.metaKey) modifiers.push("Cmd");

    // If we have modifiers and a non-modifier key
    if (modifiers.length > 0) {
      const keyCombo = [...modifiers, key].join(" + ");

      if (!masterKeys.includes(keyCombo)) {
        setMasterKeys([...masterKeys, keyCombo]);
        toast.success(`Tecla "${keyCombo}" adicionada`);
      }
    } else {
      // Just a regular key without modifiers
      if (!masterKeys.includes(key)) {
        setMasterKeys([...masterKeys, key]);
        toast.success(`Tecla "${key}" adicionada`);
      }
    }

    setIsCapturing(false);
  };

  // Handle keyup for capturing just modifier keys
  const handleKeyUp = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!isCapturing) return;

    // If a modifier key is pressed alone (no other keys)
    if (
      e.key === "Control" ||
      e.key === "Alt" ||
      e.key === "Shift" ||
      e.key === "Meta"
    ) {
      const keyMap: Record<string, string> = {
        Control: "Ctrl",
        Meta: "Cmd",
        Alt: "Alt",
        Shift: "Shift",
      };

      const friendlyKey = keyMap[e.key];

      if (!masterKeys.includes(friendlyKey)) {
        setMasterKeys([...masterKeys, friendlyKey]);
        toast.success(`Tecla "${friendlyKey}" adicionada`);
      }

      setIsCapturing(false);
    }
  };

  const removeKey = (keyToRemove: string, e: MouseEvent) => {
    e.stopPropagation();
    setMasterKeys(masterKeys.filter((key) => key !== keyToRemove));
    toast.info(`Tecla "${keyToRemove}" removida`);
  };

  const startCapturing = () => {
    setIsCapturing(true);
    toast.info("Pressione uma combinação de teclas...");
  };

  return (
    <div className="p-8 min-w-[800px] min-h-[600px] bg-white rounded-xl shadow-md">
      <h1 className="text-3xl font-bold mb-8 text-center">Compra Consciente</h1>

      <div className="mb-6">
        <p className="text-lg text-gray-700 mb-2">
          Teclas atuais para ativar o tooltip:{" "}
          <span className="font-bold">{masterKeys.join(", ")}</span>
        </p>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button className="w-full text-lg py-6">
            Configurar Teclas de Ativação
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Configurar Teclas de Ativação
            </DialogTitle>
            <DialogDescription className="text-base">
              Escolha quais teclas ativarão o tooltip ao passar o mouse sobre
              preços
            </DialogDescription>
          </DialogHeader>

          <div
            className="py-6"
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            tabIndex={0}
          >
            <label className="text-lg font-medium mb-3 block">
              Teclas de Ativação
            </label>

            <div
              className={`border rounded-md p-4 min-h-[100px] flex flex-wrap gap-2 mb-4 cursor-pointer ${
                isCapturing ? "border-blue-500 bg-blue-50" : ""
              }`}
              onClick={startCapturing}
            >
              {masterKeys.length > 0 ? (
                masterKeys.map((key) => (
                  <div
                    key={key}
                    className="bg-gray-100 rounded-md py-2 px-3 flex items-center gap-2 text-sm font-medium"
                  >
                    {key}
                    <button
                      onClick={(e) => removeKey(key, e)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-gray-400 flex items-center justify-center w-full h-full">
                  Clique para adicionar teclas
                </div>
              )}
              {isCapturing && (
                <div className="absolute inset-0 flex items-center justify-center bg-blue-50 bg-opacity-80 rounded-md">
                  <p className="text-blue-600 font-medium">
                    Pressione uma combinação de teclas...
                  </p>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-500 mt-2">
              Clique na área acima e pressione uma tecla individual (ex: Alt,
              Cmd) ou uma combinação de teclas (ex: Ctrl + S)
            </p>
          </div>

          <DialogFooter>
            <Button
              onClick={() => saveMasterKeys(masterKeys)}
              variant="default"
              className="text-lg py-6 px-8"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-8 text-base text-gray-500">
        <p>
          Quando a extensão estiver ativa, pressione a tecla configurada
          enquanto passa o mouse sobre um preço para ver o cálculo do Selic
          Saver.
        </p>
      </div>

      <Toaster />
    </div>
  );
}

export default App;
