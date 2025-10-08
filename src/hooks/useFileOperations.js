import { useToast } from "../components/ToastContainer";

export const useFileOperations = () => {
  const { showToast } = useToast();

  const exportToFile = (data, filename, itemName = "data") => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Exported successfully!", "success");
  };

  const importFromFile = async (onSuccess, itemName = "items") => {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".json";
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) {
          resolve(null);
          return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const data = JSON.parse(event.target.result);
            if (!Array.isArray(data)) {
              showToast("Invalid file format", "error");
              resolve(null);
              return;
            }

            await onSuccess(data);
            showToast(`Imported ${data.length} ${itemName}!`, "success");
            resolve(data);
          } catch (_err) {
            showToast("Error reading file", "error");
            resolve(null);
          }
        };
        reader.readAsText(file);
      };
      input.click();
    });
  };

  return { exportToFile, importFromFile };
};
