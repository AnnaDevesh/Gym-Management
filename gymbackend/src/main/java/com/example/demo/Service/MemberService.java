
package com.example.demo.Service;

import com.example.demo.Entity.Member;
import com.example.demo.Entity.Trainer;
import com.example.demo.Repository.MemberRepository;
import com.example.demo.Repository.TrainerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class MemberService {

    private final MemberRepository memberRepository;
    private final TrainerRepository trainerRepository;

    public MemberService(
            MemberRepository memberRepository,
            TrainerRepository trainerRepository) {
        this.memberRepository = memberRepository;
        this.trainerRepository = trainerRepository;
    }

    public List<Member> getAllMembers() {
        updateExpiredStatuses();
        return memberRepository.findAll();
    }

    public Member getMemberById(Long id) {
        return memberRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Member not found"));
    }

    @Transactional
    public Member createMember(Member member) {
        member.setId(null);
        member.setTrainer(resolveTrainer(member.getTrainer()));
        calculateMembership(member);
        Member savedMember = memberRepository.save(member);
        refreshAssignedMemberCount(savedMember.getTrainer());
        return savedMember;
    }

    @Transactional
    public Member updateMember(Long id, Member member) {

        Member existingMember = memberRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        Trainer previousTrainer = existingMember.getTrainer();

        existingMember.setName(member.getName());
        existingMember.setEmail(member.getEmail());
        existingMember.setPhone(member.getPhone());
        existingMember.setGender(member.getGender());
        existingMember.setDateOfBirth(member.getDateOfBirth());
        existingMember.setAddress(member.getAddress());
        existingMember.setMembershipPlan(member.getMembershipPlan());
        existingMember.setJoiningDate(member.getJoiningDate());
        existingMember.setTrainer(resolveTrainer(member.getTrainer()));

        calculateMembership(existingMember);

        Member savedMember = memberRepository.save(existingMember);
        refreshAssignedMemberCount(previousTrainer);
        if (savedMember.getTrainer() != null
                && (previousTrainer == null
                        || !savedMember.getTrainer().getId().equals(previousTrainer.getId()))) {
            refreshAssignedMemberCount(savedMember.getTrainer());
        }
        return savedMember;
    }

    public void deleteMember(Long id) {

        if (!memberRepository.existsById(id)) {
            throw new RuntimeException("Member not found");
        }

        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        Trainer trainer = member.getTrainer();
        memberRepository.delete(member);
        refreshAssignedMemberCount(trainer);
    }

    private Trainer resolveTrainer(Trainer requestedTrainer) {
        if (requestedTrainer == null || requestedTrainer.getId() == null) {
            throw new IllegalArgumentException("Trainer is required");
        }

        return trainerRepository.findById(requestedTrainer.getId())
                .orElseThrow(() -> new IllegalArgumentException("Trainer not found"));
    }

    private void refreshAssignedMemberCount(Trainer trainer) {
        if (trainer == null) {
            return;
        }

        trainer.setAssignedMembers(
                Math.toIntExact(memberRepository.countByTrainer_Id(trainer.getId())));
        trainerRepository.save(trainer);
    }

    private void calculateMembership(Member member) {

        if (member.getJoiningDate() == null) {
            throw new IllegalArgumentException("Joining date is required");
        }

        if (member.getMembershipPlan() == null) {
            throw new IllegalArgumentException("Membership plan is required");
        }

        LocalDate joiningDate = member.getJoiningDate();
        LocalDate expiryDate;

        switch (member.getMembershipPlan()) {
            case "Monthly":
                expiryDate = joiningDate.plusMonths(1);
                break;

            case "Quarterly":
                expiryDate = joiningDate.plusMonths(3);
                break;

            case "Half-Yearly":
                expiryDate = joiningDate.plusMonths(6);
                break;

            case "Yearly":
                expiryDate = joiningDate.plusMonths(12);
                break;

            default:
                throw new IllegalArgumentException("Invalid membership plan");
        }

        member.setExpiryDate(expiryDate);

        if (expiryDate.isBefore(LocalDate.now())) {
            member.setStatus("Expired");
        } else {
            member.setStatus("Active");
        }
    }

    @Transactional
    public void updateExpiredStatuses() {

        List<Member> members = memberRepository.findAll();
        LocalDate today = LocalDate.now();

        for (Member member : members) {
            if (member.getExpiryDate() != null) {

                if (member.getExpiryDate().isBefore(today)) {
                    member.setStatus("Expired");
                } else if ("Expired".equalsIgnoreCase(member.getStatus())) {
                    member.setStatus("Active");
                }
            }
        }

        memberRepository.saveAll(members);
    }
}
