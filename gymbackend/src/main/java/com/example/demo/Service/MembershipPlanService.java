package com.example.demo.Service;

import com.example.demo.Entity.MembershipPlan;
import com.example.demo.Repository.MembershipPlanRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class MembershipPlanService {

    private final MembershipPlanRepository membershipPlanRepository;

    public MembershipPlanService(MembershipPlanRepository membershipPlanRepository) {
        this.membershipPlanRepository = membershipPlanRepository;
    }

    public List<MembershipPlan> getAllPlans() {
        return membershipPlanRepository.findAll();
    }

    public Optional<MembershipPlan> getPlanById(Long id) {
        return membershipPlanRepository.findById(id);
    }

    public MembershipPlan createPlan(MembershipPlan plan) {
        return membershipPlanRepository.save(plan);
    }

    public MembershipPlan updatePlan(Long id, MembershipPlan plan) {

        MembershipPlan existingPlan = membershipPlanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Membership plan not found"));

        existingPlan.setName(plan.getName());
        existingPlan.setDuration(plan.getDuration());
        existingPlan.setPrice(plan.getPrice());
        existingPlan.setStatus(plan.getStatus());

        return membershipPlanRepository.save(existingPlan);
    }

    public void deletePlan(Long id) {

        if (!membershipPlanRepository.existsById(id)) {
            throw new RuntimeException("Membership plan not found");
        }

        membershipPlanRepository.deleteById(id);
    }
}