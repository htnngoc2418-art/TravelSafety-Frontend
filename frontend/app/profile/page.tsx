"use client";

import { Card } from "../../components/ui/card";
import { BottomNav } from "../../components/bottom-nav";
import {
  User,
  Phone,
  MapPin,
  Edit,
  LogOut,
  Plus,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { useStore } from "../../lib/store";
import { useTranslation } from "../../lib/translations";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Button } from "../../components/ui/button";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppHeader } from "../../components/app-header";
import Image from "next/image";
import { logout as logoutAPI } from "../../lib/api-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";

export default function ProfilePage() {
  const router = useRouter();
  const language = useStore((state) => state.language);
  const user = useStore((state) => state.user);
  const authToken = useStore((state) => state.authToken);
  const logout = useStore((state) => state.logout);
  const medicalInfo = useStore((state) => state.medicalInfo);
  const setMedicalInfo = useStore((state) => state.setMedicalInfo);
  const emergencyContacts = useStore((state) => state.emergencyContacts);
  const savedLocations = useStore((state) => state.savedLocations);
  const addEmergencyContact = useStore((state) => state.addEmergencyContact);
  const removeEmergencyContact = useStore(
    (state) => state.removeEmergencyContact
  );
  const addSavedLocation = useStore((state) => state.addSavedLocation);
  const removeSavedLocation = useStore((state) => state.removeSavedLocation);
  const t = useTranslation(language);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isEditingMedical, setIsEditingMedical] = useState(false);
  const [tempMedicalInfo, setTempMedicalInfo] = useState(medicalInfo);
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    email: "",
    relation: "",
  });

  const handleAddContact = () => {
    if (newContact.name && newContact.phone && newContact.email) {
      const contact = {
        id: Date.now().toString(),
        name: newContact.name,
        phone: newContact.phone,
        email: newContact.email,
        relation: newContact.relation || "Other",
      };
      addEmergencyContact(contact);
      setNewContact({ name: "", phone: "", email: "", relation: "" });
      setIsAddContactOpen(false);
    }
  };

  const handleAddLocation = () => {
    const newLocation = {
      id: Date.now().toString(),
      name: "Saved Location",
      lat: 21.0285,
      lng: 105.8542,
    };
    addSavedLocation(newLocation);
  };

  const handleSaveMedicalInfo = () => {
    setMedicalInfo(tempMedicalInfo);
    setIsEditingMedical(false);
  };

  const handleLogout = async () => {
    try {
      // Gọi API logout nếu có token
      if (authToken) {
        await logoutAPI(authToken);
      }
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Clear store và chuyển về onboarding
      logout();
      router.push("/onboarding");
    }
  };

  const isDarkMode = useStore((state) => state.isDarkMode);
  return (
    <div className="min-h-screen relative text-white overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/background-storm.jpg"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div
          className={`absolute inset-0 transition-colors duration-300 ${
            isDarkMode ? "bg-black/80" : "bg-black/30"
          }`}
        />
      </div>

      <div className="relative z-10 flex flex-col h-full min-h-screen p-4 md:p-8 gap-6 pb-24">
        <AppHeader />

        <div className="max-w-4xl mx-auto w-full space-y-6">
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/10 flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <h1 className="text-3xl font-sans flex-1">{t.profile}</h1>
          </div>

          <Card className="bg-black/40 backdrop-blur-md border-white/10 text-white p-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {user && user.first_name && user.last_name
                    ? `${user.first_name[0].toUpperCase()}${user.last_name[0].toUpperCase()}`
                    : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">
                  {user && user.first_name && user.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : "User"}
                </h2>
                <p className="text-sm text-white/70">
                  {user?.email || t.noEmail}
                </p>
                <p className="text-sm text-white/70 mt-1">
                  {user?.phone_number || t.noPhone}
                </p>
              </div>
            </div>
          </Card>

          {/* Medical Information */}
          <Card className="bg-black/40 backdrop-blur-md border-white/10 text-white p-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-semibold">{t.medicalInformation}</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTempMedicalInfo(medicalInfo);
                  setIsEditingMedical(true);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                {t.edit}
              </Button>
            </div>
            {medicalInfo ? (
              <p className="text-white/70 whitespace-pre-wrap">{medicalInfo}</p>
            ) : (
              <p className="text-white/50 italic">
                {t.noMedicalInfo}
              </p>
            )}
          </Card>

          {/* Emergency Contacts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t.emergencyContacts}</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAddContactOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t.addContact}
              </Button>
            </div>

            {emergencyContacts.length === 0 ? (
              <Card className="bg-black/40 backdrop-blur-md border-white/10 p-6 text-center text-white/70">
                {t.noEmergencyContacts}
              </Card>
            ) : (
              <div className="space-y-2">
                {emergencyContacts.map((contact) => (
                  <Card
                    key={contact.id}
                    className="bg-black/40 backdrop-blur-md border-white/10 p-4 text-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">
                          {contact.name}
                        </div>
                        <div className="text-sm text-white/70">
                          {contact.phone}
                        </div>
                        <div className="text-xs text-white/60">
                          {contact.relation}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeEmergencyContact(contact.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Saved Locations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t.savedLocations}</h2>
              <Button variant="outline" size="sm" onClick={handleAddLocation}>
                <Plus className="h-4 w-4 mr-2" />
                {t.addLocation}
              </Button>
            </div>

            {savedLocations.length === 0 ? (
              <Card className="bg-black/40 backdrop-blur-md border-white/10 p-6 text-center text-white/70">
                {t.noSavedLocations}
              </Card>
            ) : (
              <div className="space-y-2">
                {savedLocations.map((location) => (
                  <Card
                    key={location.id}
                    className="bg-black/40 backdrop-blur-md border-white/10 p-4 text-white"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-white">
                          {location.name}
                        </div>
                        <div className="text-sm text-white/70">
                          {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeSavedLocation(location.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Logout */}
          <Card
            className="bg-red-500/20 backdrop-blur-md border-red-500/30 text-white p-4 cursor-pointer hover:bg-red-500/30 transition-colors"
            onClick={handleLogout}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-500/10">
                <LogOut className="h-5 w-5 text-red-500" />
              </div>
              <span className="flex-1 font-medium text-red-500">
                {t.logout}
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* Add Contact Dialog */}
      <Dialog open={isAddContactOpen} onOpenChange={setIsAddContactOpen}>
        <DialogContent className="bg-black/90 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle>{t.addEmergencyContact}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t.name}</Label>
              <Input
                id="name"
                placeholder={t.enterName}
                value={newContact.name}
                onChange={(e) =>
                  setNewContact({ ...newContact, name: e.target.value })
                }
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t.phone}</Label>
              <Input
                id="phone"
                placeholder={t.enterPhone}
                value={newContact.phone}
                onChange={(e) =>
                  setNewContact({ ...newContact, phone: e.target.value })
                }
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t.email}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t.enterEmail}
                value={newContact.email}
                onChange={(e) =>
                  setNewContact({ ...newContact, email: e.target.value })
                }
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="relation">{t.relation}</Label>
              <Input
                id="relation"
                placeholder={t.enterRelation}
                value={newContact.relation}
                onChange={(e) =>
                  setNewContact({ ...newContact, relation: e.target.value })
                }
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <Button
              onClick={handleAddContact}
              className="w-full"
              disabled={
                !newContact.name || !newContact.phone || !newContact.email
              }
            >
              {t.addContact}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Medical Info Dialog */}
      <Dialog open={isEditingMedical} onOpenChange={setIsEditingMedical}>
        <DialogContent className="bg-black/90 border-white/20 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>{t.editMedicalInfo}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="medical">{t.medicalInformation}</Label>
              <textarea
                id="medical"
                placeholder={t.medicalInfoPlaceholder}
                value={tempMedicalInfo}
                onChange={(e) => setTempMedicalInfo(e.target.value)}
                className="w-full h-32 px-3 py-2 bg-white/10 border border-white/20 text-white placeholder:text-white/50 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsEditingMedical(false)}
                className="flex-1"
              >
                {t.cancel}
              </Button>
              <Button
                onClick={handleSaveMedicalInfo}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {t.save}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}
