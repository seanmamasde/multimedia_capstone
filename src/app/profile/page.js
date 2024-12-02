"use client";

import React, { useState } from 'react';
import AppMenubar from "../components/menubar";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    username: '使用者名稱',
    email: 'user@example.com',
    phone: '0912-345-678',
    department: '資訊工程學系',
    office: '工程三館516',
    preferredCourt: '綜合球館'
  });

  const [editForm, setEditForm] = useState({...profile});

  const handleEdit = () => setIsEditing(true);
  const handleSave = () => {
    setProfile(editForm);
    setIsEditing(false);
  };
  const handleCancel = () => {
    setEditForm({...profile});
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppMenubar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg">
          <div className="p-6">
            <div className="flex items-center space-x-4 mb-6">
              {/* <div className="w-20 h-20 rounded-full bg-blue-500 flex items-center justify-center text-white text-3xl">
                {profile.username[0].toUpperCase()}
              </div> */}
              <div>
                <h2 className="text-2xl font-bold">{profile.username}</h2>
                <p className="text-gray-500">{profile.department}</p>
              </div>
              <div className="ml-auto">
                {!isEditing ? (
                  <button 
                    onClick={handleEdit} 
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    編輯資料
                  </button>
                ) : (
                  <div className="space-x-2">
                    <button 
                      onClick={handleSave} 
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                    >
                      儲存
                    </button>
                    <button 
                      onClick={handleCancel} 
                      className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                    >
                      取消
                    </button>
                  </div>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                {Object.keys(editForm).map((key) => {
                  if (key !== 'username') {
                    return (
                      <div key={key}>
                        <label className="block mb-2">{key}</label>
                        <input
                          type="text"
                          value={editForm[key]}
                          onChange={(e) => setEditForm({...editForm, [key]: e.target.value})}
                          className="w-full px-3 py-2 border rounded"
                        />
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(profile).map(([key, value]) => {
                  if (key !== 'username') {
                    return (
                      <div key={key} className="flex items-center">
                        <span className="font-medium mr-4 w-24">{key}:</span>
                        <span>{value}</span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Profile;