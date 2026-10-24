import React from "react";
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Toaster, toast } from "@/components/ui/sonner";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

describe("Shadify P0 Design System UI Components", () => {
  it("renders Tabs with list, triggers, and active content", () => {
    const html = renderToStaticMarkup(
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rsvps">RSVPs</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Overview Panel Content</TabsContent>
        <TabsContent value="rsvps">RSVP Panel Content</TabsContent>
      </Tabs>,
    );

    expect(html).toContain("Overview");
    expect(html).toContain("RSVPs");
    expect(html).toContain("Overview Panel Content");
    expect(html).toContain("border-ui-border");
  });

  it("renders semantic Table with headers, rows, cells, and caption", () => {
    const html = renderToStaticMarkup(
      <Table>
        <TableCaption>Wedding Guest List</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Guest Name</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Kavya Sharma</TableCell>
            <TableCell>Confirmed</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    expect(html).toContain("Wedding Guest List");
    expect(html).toContain("<th");
    expect(html).toContain("Guest Name");
    expect(html).toContain("<td");
    expect(html).toContain("Kavya Sharma");
    expect(html).toContain("Confirmed");
  });

  it("renders accessible Switch with role='switch'", () => {
    const html = renderToStaticMarkup(<Switch aria-label="Enable PIN Gate" defaultChecked />);
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-label="Enable PIN Gate"');
    expect(html).toContain("data-state=");
  });

  it("renders accessible Checkbox with role='checkbox'", () => {
    const html = renderToStaticMarkup(<Checkbox aria-label="Vegetarian Meal" defaultChecked />);
    expect(html).toContain('role="checkbox"');
    expect(html).toContain('aria-label="Vegetarian Meal"');
  });

  it("renders Label with text and connects to htmlFor", () => {
    const html = renderToStaticMarkup(
      <div>
        <Label htmlFor="guest-pin">Guest Access PIN</Label>
        <input id="guest-pin" type="text" />
      </div>,
    );
    expect(html).toContain('for="guest-pin"');
    expect(html).toContain("Guest Access PIN");
    expect(html).toContain("text-ui-text-primary");
  });

  it("exports sonner toast and renders Toaster without crashing", () => {
    expect(typeof toast).toBe("function");
    const html = renderToStaticMarkup(<Toaster />);
    expect(html).toBeDefined();
  });

  it("renders AlertDialog trigger structure", () => {
    const html = renderToStaticMarkup(
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button type="button">Delete Wedding</button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction>Confirm Delete</AlertDialogAction>
        </AlertDialogContent>
      </AlertDialog>,
    );

    expect(html).toContain("Delete Wedding");
  });
});
