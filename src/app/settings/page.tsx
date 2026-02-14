"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/Button";
import { SongSearchModal } from "@/components/ui/SongSearchModal";
import { Camera, Save, Trash2, Loader2, User, Mail, Music, X } from "lucide-react";

// Icon helper
function SettingsIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    )
}

const PASTEL_COLORS = [
    { name: 'rose', value: 'bg-muted-rose text-white', label: 'Rose' },
    { name: 'blue', value: 'bg-indigo-400 text-white', label: 'Blue' },
    { name: 'green', value: 'bg-sage-green text-white', label: 'Green' },
    { name: 'orange', value: 'bg-orange-400 text-white', label: 'Orange' },
    { name: 'purple', value: 'bg-purple-400 text-white', label: 'Purple' },
    { name: 'yellow', value: 'bg-yellow-400 text-white', label: 'Yellow' },
];

function ColorPicker({ selected, onChange }: { selected: string, onChange: (color: string) => void }) {
    return (
        <div className="flex gap-2 mt-2">
            {PASTEL_COLORS.map((color) => (
                <button
                    key={color.name}
                    type="button"
                    onClick={() => onChange(color.name)}
                    className={`w-6 h-6 rounded-full border-2 ${color.value.split(' ')[0]} ${selected === color.name ? 'border-warm-grey' : 'border-transparent'} hover:scale-110 transition-transform`}
                    title={color.label}
                />
            ))}
        </div>
    );
}

export default function SettingsPage() {
    const router = useRouter();
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Form State
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [avatarUrl, setAvatarUrl] = useState("");
    const [uploading, setUploading] = useState(false);

    const [isFriendsPublic, setIsFriendsPublic] = useState(true);

    // Account Security State
    const [email, setEmail] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [updatingAccount, setUpdatingAccount] = useState(false);

    // Anthem Fields
    const [songTitle, setSongTitle] = useState("");
    const [songArtist, setSongArtist] = useState("");
    const [songLink, setSongLink] = useState("");
    const [songPreview, setSongPreview] = useState("");
    const [songArtwork, setSongArtwork] = useState("");
    const [isSongModalOpen, setIsSongModalOpen] = useState(false);

    // New Bio Fields
    const [school, setSchool] = useState("");
    const [schoolColor, setSchoolColor] = useState("rose");
    const [church, setChurch] = useState("");
    const [churchColor, setChurchColor] = useState("blue");
    const [sport, setSport] = useState("");
    const [sportColor, setSportColor] = useState("orange");
    const [hobby, setHobby] = useState("");
    const [hobbyColor, setHobbyColor] = useState("green");
    const [favVerse, setFavVerse] = useState("");
    const [favVerseColor, setFavVerseColor] = useState("purple");

    useEffect(() => {
        const getProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }
            setUser(user);
            setEmail(user.email || "");

            const { data: profile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", user.id)
                .single();

            if (profile) {
                setFirstName(profile.first_name || "");
                setLastName(profile.last_name || "");
                setUsername(profile.username || "");
                setBio(profile.biography || "");
                setAvatarUrl(profile.avatar_url || "");
                setIsFriendsPublic(profile.is_friends_public ?? true);
                setSongTitle(profile.song_title || "");
                setSongArtist(profile.song_artist || "");
                setSongLink(profile.song_link || "");
                setSongPreview(profile.song_preview_url || "");
                setSongArtwork(profile.song_album_art || "");
                setSchool(profile.school || "");
                setSchoolColor(profile.school_color || "rose");
                setChurch(profile.church || "");
                setChurchColor(profile.church_color || "blue");
                setSport(profile.sport || "");
                setSportColor(profile.sport_color || "orange");
                setHobby(profile.hobby || "");
                setHobbyColor(profile.hobby_color || "green");
                setFavVerse(profile.fav_verse || "");
                setFavVerseColor(profile.fav_verse_color || "purple");
            }
            setLoading(false);
        };
        getProfile();
    }, [router]);

    const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Check if bucket exists, if not use 'posts' (commonly available) or 'avatars'
            // We'll assume 'posts' is safe based on previous context, or fallback gracefully
            let { error: uploadError } = await supabase.storage
                .from('posts') // Reusing posts bucket for simplicity in this demo environment
                .upload(filePath, file);

            if (uploadError) {
                // Try 'avatars' bucket if posts fails (or just create it if we could)
                console.warn("Upload to 'posts' failed, trying 'avatars'", uploadError);
                const { error: retryError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, file);
                if (retryError) throw retryError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('posts')
                .getPublicUrl(filePath);

            setAvatarUrl(publicUrl);

            // Auto-save avatar reference
            await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);

        } catch (error) {
            alert('Error uploading avatar! Ensure storage buckets are set up.');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);

        const { error } = await supabase
            .from("profiles")
            .update({
                first_name: firstName,
                last_name: lastName,
                username: username,
                biography: bio,
                avatar_url: avatarUrl,
                is_friends_public: isFriendsPublic,
                song_title: songTitle,
                song_artist: songArtist,
                song_link: songLink,
                song_preview_url: songPreview,
                song_album_art: songArtwork,
                school: school,
                school_color: schoolColor,
                church: church,
                church_color: churchColor,
                sport: sport,
                sport_color: sportColor,
                hobby: hobby,
                hobby_color: hobbyColor,
                fav_verse: favVerse,
                fav_verse_color: favVerseColor,
                updated_at: new Date().toISOString(),
            })
            .eq("id", user.id);

        if (error) {
            console.error("Profile update error:", error);
            alert(`Error updating profile: ${error.message}`);
        } else {
            alert("Profile updated successfully!");
        }
        setSaving(false);
    };

    const handleUpdateEmail = async () => {
        if (!newEmail || newEmail === email) return;
        setUpdatingAccount(true);
        const { error } = await supabase.auth.updateUser({ email: newEmail });
        if (error) {
            alert(`Error updating email: ${error.message}`);
        } else {
            alert("Confirmation link sent to both old and new email addresses. Please check your inbox.");
            setNewEmail("");
        }
        setUpdatingAccount(false);
    };

    const handleUpdatePassword = async () => {
        if (!password || password !== confirmPassword) {
            alert("Passwords do not match or are empty.");
            return;
        }
        setUpdatingAccount(true);
        const { error } = await supabase.auth.updateUser({ password: password });
        if (error) {
            alert(`Error updating password: ${error.message}`);
        } else {
            alert("Password updated successfully!");
            setPassword("");
            setConfirmPassword("");
        }
        setUpdatingAccount(false);
    };

    const handleDeleteAccount = async () => {
        if (confirm("Are you sure? This will delete your profile and data. This action cannot be undone.")) {
            try {
                const { error } = await supabase.rpc('delete_own_account');
                if (error) {
                    console.error("Deletion error:", error);
                    alert("Error deleting account: " + error.message);
                } else {
                    alert("Your account has been deleted.");
                    await supabase.auth.signOut();
                    router.push('/');
                }
            } catch (err) {
                console.error("Deletion exception:", err);
                alert("An unexpected error occurred.");
            }
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-warm-paper flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-warm-grey/40" />
        </div>
    );

    return (
        <div className="min-h-screen bg-warm-paper font-sans selection:bg-muted-rose/20">
            <Navbar />

            <main className="container mx-auto px-4 pt-24 pb-20 max-w-2xl">
                <div className="bg-white/80 backdrop-blur-md border border-white rounded-3xl p-8 md:p-10 shadow-sm animate-fade-in-up">
                    <div className="flex items-center gap-3 mb-8 pb-4 border-b border-warm-grey/5">
                        <div className="w-10 h-10 rounded-full bg-soft-blush/30 flex items-center justify-center text-muted-rose">
                            <SettingsIcon className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="font-serif text-2xl text-warm-cocoa">Settings</h1>
                            <p className="text-xs text-warm-grey/60">Manage your profile and account.</p>
                        </div>
                    </div>

                    {/* Avatar Section */}
                    <div className="flex flex-col items-center mb-10">
                        <div className="relative group cursor-pointer w-28 h-28 mb-4">
                            <div className="w-28 h-28 rounded-full bg-stone-100 border-4 border-white shadow-lg overflow-hidden relative">
                                {avatarUrl ? (
                                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-warm-grey/20 text-4xl font-serif">
                                        {(firstName?.[0] || "")}
                                    </div>
                                )}
                                {uploading && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                                    </div>
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 bg-deep-velvet text-white p-2 rounded-full cursor-pointer hover:bg-deep-velvet/90 transition-colors shadow-md transform translate-x-1 translate-y-1">
                                <Camera className="w-4 h-4" />
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarUpload}
                                    disabled={uploading}
                                />
                            </label>
                        </div>
                        <p className="text-xs text-warm-grey/60">Click camera to upload</p>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-warm-grey/60 mb-2">First Name</label>
                                <input
                                    type="text"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-sm text-warm-grey focus:ring-2 ring-muted-rose/20 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-warm-grey/60 mb-2">Last Name</label>
                                <input
                                    type="text"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-sm text-warm-grey focus:ring-2 ring-muted-rose/20 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-warm-grey/60 mb-2">Username</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-grey/30" />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-stone-50 border-none rounded-xl pl-10 pr-4 py-3 text-sm text-warm-grey focus:ring-2 ring-muted-rose/20 outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-warm-grey/60 mb-2">Email</label>
                            <div className="relative opacity-60">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-grey/30" />
                                <input
                                    type="text"
                                    value={email}
                                    disabled
                                    className="w-full bg-stone-50 border-none rounded-xl pl-10 pr-4 py-3 text-sm text-warm-grey cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Account Security Section */}
                        <div className="pt-6 border-t border-warm-grey/10">
                            <h3 className="text-sm font-bold text-warm-cocoa mb-4">Account Security</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-warm-grey/60 mb-2">Update Email</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="email"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            placeholder="new.email@example.com"
                                            className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-sm text-warm-grey focus:ring-2 ring-muted-rose/20 outline-none"
                                        />
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={handleUpdateEmail}
                                            disabled={updatingAccount || !newEmail || newEmail === email}
                                        >
                                            Update
                                        </Button>
                                    </div>
                                    <p className="text-[10px] text-warm-grey/40 mt-1">You will need to confirm this change via email.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-warm-grey/60 mb-2">Change Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="New Password"
                                        className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-sm text-warm-grey focus:ring-2 ring-muted-rose/20 outline-none mb-2"
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm Password"
                                            className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-sm text-warm-grey focus:ring-2 ring-muted-rose/20 outline-none"
                                        />
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={handleUpdatePassword}
                                            disabled={updatingAccount || !password || password !== confirmPassword}
                                        >
                                            Save
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-warm-grey/60 mb-2">Bio</label>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Tell us a bit about your journey..."
                                className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-sm text-warm-grey focus:ring-2 ring-muted-rose/20 outline-none h-24 resize-none"
                            />
                        </div>

                        {/* Extended Bio Details */}
                        <div className="pt-6 border-t border-warm-grey/10">
                            <h3 className="text-sm font-bold text-warm-cocoa mb-4">Profile Details</h3>

                            {/* Anthem Section */}
                            <div className="mb-8">
                                <label className="block text-xs font-bold uppercase tracking-wider text-warm-grey/60 mb-3">My Anthem</label>

                                {songTitle ? (
                                    <div className="flex items-center gap-4 p-4 bg-stone-50 border border-stone-100 rounded-xl relative group">
                                        <div className="w-12 h-12 rounded-lg bg-stone-200 overflow-hidden shrink-0 shadow-sm">
                                            {songArtwork ? (
                                                <img src={songArtwork} alt="Cover" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-stone-200">
                                                    <Music className="w-5 h-5 text-warm-grey/40" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-warm-cocoa truncate">{songTitle}</div>
                                            <div className="text-xs text-warm-grey/60 truncate">{songArtist}</div>
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <button
                                                onClick={() => setIsSongModalOpen(true)}
                                                className="p-2 text-warm-grey/40 hover:text-deep-velvet hover:bg-warm-grey/5 rounded-full transition-colors"
                                                title="Change Song"
                                            >
                                                <Music className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSongTitle("");
                                                    setSongArtist("");
                                                    setSongLink("");
                                                    setSongPreview("");
                                                    setSongArtwork("");
                                                }}
                                                className="p-2 text-warm-grey/40 hover:text-red-400 hover:bg-red-50 rounded-full transition-colors"
                                                title="Remove Song"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsSongModalOpen(true)}
                                        className="w-full py-4 border-2 border-dashed border-warm-grey/20 rounded-xl text-warm-grey/60 hover:border-muted-rose/40 hover:text-muted-rose hover:bg-soft-blush/10 transition-all flex flex-col items-center gap-2 group"
                                    >
                                        <Music className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                        <span className="text-sm font-medium">Search for an Anthem</span>
                                    </button>
                                )}

                                <SongSearchModal
                                    isOpen={isSongModalOpen}
                                    onClose={() => setIsSongModalOpen(false)}
                                    onSelect={(song) => {
                                        setSongTitle(song.title);
                                        setSongArtist(song.artist);
                                        setSongLink(song.link);
                                        setSongPreview(song.previewUrl);
                                        setSongArtwork(song.artwork);
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-warm-grey/60 mb-2">My School</label>
                                    <input
                                        type="text"
                                        value={school}
                                        onChange={(e) => setSchool(e.target.value)}
                                        placeholder="University of Grace"
                                        className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-sm text-warm-grey focus:ring-2 ring-muted-rose/20 outline-none mb-2"
                                    />
                                    <ColorPicker selected={schoolColor} onChange={setSchoolColor} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-warm-grey/60 mb-2">My Church</label>
                                    <input
                                        type="text"
                                        value={church}
                                        onChange={(e) => setChurch(e.target.value)}
                                        placeholder="Selahly Chapel"
                                        className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-sm text-warm-grey focus:ring-2 ring-muted-rose/20 outline-none mb-2"
                                    />
                                    <ColorPicker selected={churchColor} onChange={setChurchColor} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-warm-grey/60 mb-2">My Sport</label>
                                    <input
                                        type="text"
                                        value={sport}
                                        onChange={(e) => setSport(e.target.value)}
                                        placeholder="Volleyball"
                                        className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-sm text-warm-grey focus:ring-2 ring-muted-rose/20 outline-none mb-2"
                                    />
                                    <ColorPicker selected={sportColor} onChange={setSportColor} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-warm-grey/60 mb-2">My Hobby</label>
                                    <input
                                        type="text"
                                        value={hobby}
                                        onChange={(e) => setHobby(e.target.value)}
                                        placeholder="Painting"
                                        className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-sm text-warm-grey focus:ring-2 ring-muted-rose/20 outline-none mb-2"
                                    />
                                    <ColorPicker selected={hobbyColor} onChange={setHobbyColor} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-warm-grey/60 mb-2">My Fav Verse</label>
                                    <input
                                        type="text"
                                        value={favVerse}
                                        onChange={(e) => setFavVerse(e.target.value)}
                                        placeholder="Philippians 4:13"
                                        className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-sm text-warm-grey focus:ring-2 ring-muted-rose/20 outline-none mb-2"
                                    />
                                    <ColorPicker selected={favVerseColor} onChange={setFavVerseColor} />
                                </div>
                            </div>
                        </div>

                    </div>
                    <div className="pt-4 flex items-center justify-between border-t border-warm-grey/10 mt-6">
                        <div>
                            <h3 className="text-sm font-bold text-warm-cocoa">Friend List Privacy</h3>
                            <p className="text-xs text-warm-grey/60">Allow others to see your friends list on your profile.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isFriendsPublic}
                                onChange={(e) => setIsFriendsPublic(e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-muted-rose/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-muted-rose"></div>
                        </label>
                    </div>
                    <div className="pt-4 flex justify-end">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-deep-velvet text-white px-8 rounded-xl shadow-lg shadow-deep-velvet/20"
                        >
                            {saving ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                            ) : (
                                <><Save className="w-4 h-4 mr-2" /> Save Changes</>
                            )}
                        </Button>
                    </div>


                    {/* Danger Zone */}
                    <div className="mt-12 pt-8 border-t border-red-100">
                        <h3 className="text-red-900 font-serif text-lg mb-2">Danger Zone</h3>
                        <p className="text-xs text-red-700/60 mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                        <Button
                            variant="outline"
                            onClick={handleDeleteAccount}
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 w-full justify-start"
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete Account
                        </Button>
                    </div>
                </div>
            </main >
        </div >
    );
}
