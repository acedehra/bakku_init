import { useState } from "react";
import { Environment, EnvironmentVariable } from "../types";
import { X, Plus, Trash2, Settings } from "lucide-react";
import { Button } from "./ui/button";

interface EnvironmentManagerProps {
    environments: Environment[];
    onAdd: (name: string) => Environment;
    onUpdate: (env: Environment) => void;
    onDelete: (id: string) => void;
    onClose: () => void;
}

export function EnvironmentManager({
    environments,
    onAdd,
    onUpdate,
    onDelete,
    onClose,
}: EnvironmentManagerProps) {
    const [selectedEnvId, setSelectedEnvId] = useState<string | null>(
        environments.length > 0 ? environments[0].id : null
    );
    const [isAddingEnv, setIsAddingEnv] = useState(false);
    const [newEnvName, setNewEnvName] = useState("");

    const activeEnv = environments.find((e) => e.id === selectedEnvId);

    const handleAddEnv = () => {
        if (newEnvName.trim()) {
            const newEnv = onAdd(newEnvName);
            setSelectedEnvId(newEnv.id);
            setNewEnvName("");
            setIsAddingEnv(false);
        }
    };

    const handleAddVariable = () => {
        if (activeEnv) {
            const newVar: EnvironmentVariable = {
                key: "",
                value: "",
                enabled: true,
            };
            onUpdate({
                ...activeEnv,
                variables: [...activeEnv.variables, newVar],
            });
        }
    };

    const updateVariable = (index: number, updates: Partial<EnvironmentVariable>) => {
        if (activeEnv) {
            const newVariables = [...activeEnv.variables];
            newVariables[index] = { ...newVariables[index], ...updates };
            onUpdate({ ...activeEnv, variables: newVariables });
        }
    };

    const deleteVariable = (index: number) => {
        if (activeEnv) {
            const newVariables = activeEnv.variables.filter((_, i) => i !== index);
            onUpdate({ ...activeEnv, variables: newVariables });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-4 border-b border-border flex justify-between items-center bg-accent/5">
                    <div className="flex items-center gap-2">
                        <Settings className="text-primary" size={20} />
                        <h2 className="text-lg font-bold">Manage Environments</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-accent rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-64 border-r border-border bg-accent/5 flex flex-col">
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {environments.map((env) => (
                                <button
                                    key={env.id}
                                    onClick={() => setSelectedEnvId(env.id)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-all ${selectedEnvId === env.id
                                        ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                                        : "hover:bg-accent/50 text-muted-foreground"
                                        }`}
                                >
                                    <span className="truncate">{env.name}</span>
                                    {selectedEnvId === env.id && (
                                        <Trash2
                                            size={14}
                                            className="opacity-70 hover:opacity-100 transition-opacity"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(env.id);
                                                if (selectedEnvId === env.id) {
                                                    setSelectedEnvId(environments.find(item => item.id !== env.id)?.id || null);
                                                }
                                            }}
                                        />
                                    )}
                                </button>
                            ))}
                            {isAddingEnv ? (
                                <div className="p-2 space-y-2">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={newEnvName}
                                        onChange={(e) => setNewEnvName(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleAddEnv()}
                                        placeholder="Env name..."
                                        className="w-full h-8 px-2 text-xs rounded border border-input bg-background focus:ring-1 focus:ring-primary"
                                    />
                                    <div className="flex gap-1">
                                        <Button
                                            size="sm"
                                            className="h-7 text-[10px] flex-1"
                                            onClick={handleAddEnv}
                                        >
                                            Add
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-7 text-[10px] flex-1"
                                            onClick={() => setIsAddingEnv(false)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setIsAddingEnv(true)}
                                    className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                                >
                                    <Plus size={14} />
                                    <span>New Environment</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Variables Table */}
                    <div className="flex-1 flex flex-col bg-background">
                        {activeEnv ? (
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div className="p-4 border-b border-border bg-accent/5">
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-sm font-bold opacity-60 uppercase tracking-wider">Variables for {activeEnv.name}</h3>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                                <th className="pb-3 pl-2 w-8"></th>
                                                <th className="pb-3 px-2">Key</th>
                                                <th className="pb-3 px-2">Value</th>
                                                <th className="pb-3 pr-2 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {activeEnv.variables.map((v, i) => (
                                                <tr key={i} className="group hover:bg-accent/20 transition-colors">
                                                    <td className="py-2 pl-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={v.enabled}
                                                            onChange={(e) =>
                                                                updateVariable(i, { enabled: e.target.checked })
                                                            }
                                                            className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-2">
                                                        <input
                                                            type="text"
                                                            value={v.key}
                                                            onChange={(e) =>
                                                                updateVariable(i, { key: e.target.value })
                                                            }
                                                            placeholder="VARIABLE_NAME"
                                                            className="w-full h-8 px-2 text-sm rounded border border-transparent bg-transparent hover:border-input focus:border-primary focus:bg-background transition-all outline-none"
                                                        />
                                                    </td>
                                                    <td className="py-2 px-2">
                                                        <input
                                                            type="text"
                                                            value={v.value}
                                                            onChange={(e) =>
                                                                updateVariable(i, { value: e.target.value })
                                                            }
                                                            placeholder="Value"
                                                            className="w-full h-8 px-2 text-sm rounded border border-transparent bg-transparent hover:border-input focus:border-primary focus:bg-background transition-all outline-none"
                                                        />
                                                    </td>
                                                    <td className="py-2 pr-2 text-right">
                                                        <button
                                                            onClick={() => deleteVariable(i)}
                                                            className="p-1 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    <button
                                        onClick={handleAddVariable}
                                        className="mt-4 flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                                    >
                                        <Plus size={14} />
                                        <span>Add variable</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                                <div className="bg-accent/20 p-4 rounded-full mb-4">
                                    <Settings size={40} className="opacity-20" />
                                </div>
                                <h3 className="text-lg font-medium text-foreground mb-2">No Environment Selected</h3>
                                <p className="max-w-xs">Create or select an environment from the sidebar to manage its variables.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
