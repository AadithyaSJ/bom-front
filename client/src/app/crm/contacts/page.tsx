"use client";

import { useState } from "react";
import ContactsToolbar from "../components/ContactsToolbar";
import ContactsTable from "../components/ContactsTable";
import AddContactModal from "../components/AddContactModal";

interface Contact {
  name: string;
  company: string;
  email: string;
  phone: string;
  owner: string;
}

interface ContactFormData {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  owner?: string;
}


export default function ContactsPage() {
  const [contacts, setContacts] = useState([
    {
      name: "Ted Watson",
      company: "Zylker Corp",
      email: "support@bigin.com",
      phone: "",
      owner: "hemanthtech",
    },
  ]);

  const [isModalOpen, setModalOpen] = useState(false);

  // Assuming ContactFormData has fields: company, email, and any others from the form
  const handleAddContact = (form: ContactFormData) => {
    const newContact: Contact = {
      name: form.name ?? "", // or set default/required
      company: form.company ?? "",
      email: form.email ?? "",
      phone: form.phone ?? "",
      owner: form.owner ?? "",
    };
    setContacts([...contacts, newContact]);
    setModalOpen(false);
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg h-full flex flex-col">
      {/* Toolbar */}
      <ContactsToolbar onAddContact={() => setModalOpen(true)} />

      {/* Table */}
      <div className="mt-4 flex-1 overflow-auto">
        <ContactsTable contacts={contacts} />
      </div>

      {/* Modal */}
      {isModalOpen && (
        <AddContactModal
          onClose={() => setModalOpen(false)}
          onSave={handleAddContact}
        />
      )}
    </div>
  );
}
