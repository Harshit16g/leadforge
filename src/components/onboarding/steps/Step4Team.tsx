"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Member {
    id: string;
    name: string;
    role: string;
    services: string[];
}

interface Props {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updateData: (d: any) => void;
}

const ROLES = [
    { value: "stylist", label: "Stylist" },
    { value: "therapist", label: "Therapist" },
    { value: "technician", label: "Technician" },
    { value: "manager", label: "Manager" },
    { value: "receptionist", label: "Receptionist" },
];

export function Step4Team({ data, updateData }: Props) {
    const team: Member[] = data.team || [];
    const [name, setName] = useState("");
    const [role, setRole] = useState("stylist");

    const add = () => {
        if (!name.trim()) return;
        const m: Member = { id: crypto.randomUUID(), name: name.trim(), role, services: [] };
        updateData({ team: [...team, m] });
        setName(""); setRole("stylist");
    };

    const remove = (id: string) =>
        updateData({ team: team.filter((m) => m.id !== id) });

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-[1fr_140px_auto] items-end gap-2">
                <div className="space-y-1.5">
                    <Label>Name</Label>
                    <Input
                        placeholder="e.g. Priya Sharma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && add()}
                        autoFocus
                    />
                </div>
                <div className="space-y-1.5">
                    <Label>Role</Label>
                    <Select value={role} onValueChange={setRole}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {ROLES.map((r) => (
                                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button type="button" size="icon" onClick={add}>
                    <span className="icon-[solar--add-circle-bold-duotone] size-4" />
                </Button>
            </div>

            {team.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                    No team members added yet. Add at least one.
                </p>
            ) : (
                <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                    {team.map((m) => (
                        <div
                            key={m.id}
                            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-4 py-3"
                        >
                            <div>
                                <p className="text-sm font-semibold text-foreground">{m.name}</p>
                                <p className="text-xs text-muted-foreground capitalize">{m.role}</p>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => remove(m.id)}
                            >
                                <span className="icon-[solar--trash-bin-trash-bold-duotone] size-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

