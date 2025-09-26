"use client";

import { ChangeEvent, useState } from "react";
type ContactFormData = {
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  company: string;
  mobile: string;
  description: string;
  mailingStreet: string;
  mailingCity: string;
  mailingState: string;
  mailingCountry: string;
  mailingZip: string;
  [key: string]: string; // Add index signature
};

type AddContactModalProps = {
  onClose: () => void;
  onSave: (form: ContactFormData) => void;
};



export default function AddContactModal({ onClose, onSave }: AddContactModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    title: "",
    email: "",
    company: "",
    mobile: "",
    description: "",
    mailingStreet: "",
    mailingCity: "",
    mailingState: "",
    mailingCountry: "",
    mailingZip: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 flex justify-end bg-black bg-opacity-40 z-50">
      {/* Side Drawer */}
      <div className="w-full sm:w-[500px] bg-white shadow-xl h-full flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-xl font-semibold">Add Contact</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium mb-4">Contact Information</h3>
            <div className="space-y-4">
              {[
                ["First Name", "firstName"],
                ["Last Name", "lastName"],
                ["Title", "title"],
                ["Email", "email"],
                ["Company Name", "company"],
                ["Mobile", "mobile"],
                ["Description", "description"],
              ].map(([label, name]) => (
                <div key={name} className="flex items-center">
                  <label className="w-40 text-gray-700">{label}</label>
                  <input
                    type="text"
                    name={name}
                    value={(formData as ContactFormData)[name]}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Address Details */}
          <div>
            <h3 className="text-lg font-medium mb-4">Address Details</h3>
            <div className="space-y-4">
              {[
                ["Mailing Street", "mailingStreet"],
                ["Mailing City", "mailingCity"],
                ["Mailing State", "mailingState"],
                ["Mailing Country", "mailingCountry"],
                ["Mailing Zip", "mailingZip"],
              ].map(([label, name]) => (
                <div key={name} className="flex items-center">
                  <label className="w-40 text-gray-700">{label}</label>
                  <input
                    type="text"
                    name={name}
                    value={(formData as ContactFormData)[name]}
                    onChange={handleChange}
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-2xl border border-gray-300 text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-2xl bg-green-600 text-white hover:bg-green-700"
          >
            Save
          </button>
        </div>
      </div>

      {/* Animation */}
      <style jsx>{`
        .animate-slide-in {
          animation: slideIn 0.3s ease-out forwards;
        }
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0%);
          }
        }
      `}</style>
    </div>
  );
}
