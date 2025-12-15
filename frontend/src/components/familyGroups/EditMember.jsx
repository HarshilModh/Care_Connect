import React, { useEffect, useState } from 'react'
import api from '../../api/axios'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
const EditMember = () => {
  const { memberId } = useParams()
  const navigate = useNavigate()
  const [role, setRole] = useState("")
  useEffect(() => {
    const fetchMember = async () => {
      try {
        const response = await api.get(`/family-groups/member/${memberId}`)
        const member = response.data
        s
        // set form fields with member data
      } catch (error) {
        console.error("Error fetching member:", error)
        toast.error("Failed to load member details")
        navigate(-1)
      }
    }
    fetchMember()
  }, [memberId, navigate])
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        role,
      }
      const res = await api.put(`/family-groups/member/${memberId}`,payload)
      console.log("Edit member response:", res)
      toast.success("Member updated successfully")
      navigate(-1)
    } catch (err) {
      console.error("Error updating member", err)
      toast.error(
        err.response?.data?.error ||
          err.message ||
          "Failed to update member"
      )
    }
  }
  return (
    <div>
      Edit Member Component
      <form onSubmit={handleSubmit}>
        {/* only change role */}
        <label>Role:</label>
        <select name="role" /* value and onChange handlers */>
        {/* by default  */}
          <option value="admin" selected={role==="admin"}>Admin</option>
          <option value="familyMember" selected={role==="familyMember"}> Family Member</option>
          <option value="careGiver" selected={role==="careGiver"}>Care Giver</option>
          <option value="careRecipient" selected={role==="careRecipient"}>Care Recipient</option>
        </select>
        <button type="submit">Save Changes</button>
      </form>
    </div>
  )
}

export default EditMember