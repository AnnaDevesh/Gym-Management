
package com.example.demo.Service;

import com.example.demo.Entity.Member;
import com.example.demo.Entity.MembershipPlan;
import com.example.demo.Entity.Trainer;
import com.example.demo.Repository.MemberRepository;
import com.example.demo.Repository.MembershipPlanRepository;
import com.example.demo.Repository.TrainerRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private final MemberRepository memberRepository;
    private final TrainerRepository trainerRepository;
    private final MembershipPlanRepository membershipPlanRepository;

    public DashboardService(
            MemberRepository memberRepository,
            TrainerRepository trainerRepository,
            MembershipPlanRepository membershipPlanRepository) {

        this.memberRepository = memberRepository;
        this.trainerRepository = trainerRepository;
        this.membershipPlanRepository = membershipPlanRepository;
    }

    public Map<String, Object> getDashboardData() {

        List<Member> members = memberRepository.findAll();
        List<Trainer> trainers = trainerRepository.findAll();
        List<MembershipPlan> plans = membershipPlanRepository.findAll();

        long activeMembers = 0;
        long expiredMembers = 0;
        long expiringSoon = 0;
        long activePlans = 0;

        long monthlyMembers = 0;
        long quarterlyMembers = 0;
        long halfYearlyMembers = 0;
        long yearlyMembers = 0;

        LocalDate today = LocalDate.now();

        for (Member member : members) {

            if ("Active".equalsIgnoreCase(member.getStatus())) {
                activeMembers++;
            }

            if ("Expired".equalsIgnoreCase(member.getStatus())) {
                expiredMembers++;
            }

            // Count only active memberships expiring within 7 days.
            if ("Active".equalsIgnoreCase(member.getStatus())
                    && member.getExpiryDate() != null) {

                long daysRemaining = ChronoUnit.DAYS.between(
                        today,
                        member.getExpiryDate());

                if (daysRemaining >= 0 && daysRemaining <= 7) {
                    expiringSoon++;
                }
            }

            String membershipPlan = member.getMembershipPlan();

            if (membershipPlan != null) {

                if ("Monthly".equalsIgnoreCase(membershipPlan)) {
                    monthlyMembers++;
                } else if ("Quarterly".equalsIgnoreCase(membershipPlan)) {
                    quarterlyMembers++;
                } else if ("Half-Yearly".equalsIgnoreCase(membershipPlan)) {
                    halfYearlyMembers++;
                } else if ("Yearly".equalsIgnoreCase(membershipPlan)) {
                    yearlyMembers++;
                }
            }
        }

        for (MembershipPlan plan : plans) {
            if ("Active".equalsIgnoreCase(plan.getStatus())) {
                activePlans++;
            }
        }

        List<Member> sortedMembers = members.stream()
                .sorted(Comparator.comparing(
                        Member::getJoiningDate,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(3)
                .toList();

        List<Map<String, Object>> recentMembers = sortedMembers.stream()
                .map(member -> {
                    Map<String, Object> recentMember = new HashMap<>();

                    recentMember.put("id", member.getId());
                    recentMember.put("name", member.getName());
                    recentMember.put("membershipPlan", member.getMembershipPlan());
                    recentMember.put("status", member.getStatus());

                    return recentMember;
                })
                .toList();

        Map<String, Object> dashboardData = new HashMap<>();

        dashboardData.put("totalMembers", members.size());
        dashboardData.put("activeMembers", activeMembers);
        dashboardData.put("expiredMembers", expiredMembers);
        dashboardData.put("expiringSoon", expiringSoon);
        dashboardData.put("totalTrainers", trainers.size());
        dashboardData.put("activePlans", activePlans);

        dashboardData.put("monthlyMembers", monthlyMembers);
        dashboardData.put("quarterlyMembers", quarterlyMembers);
        dashboardData.put("halfYearlyMembers", halfYearlyMembers);
        dashboardData.put("yearlyMembers", yearlyMembers);

        dashboardData.put("recentMembers", recentMembers);

        return dashboardData;
    }

    public List<Map<String, Object>> getExpiryNotifications() {
        LocalDate expiryDate = LocalDate.now().plusDays(1);

        return memberRepository.findByStatusIgnoreCaseAndExpiryDate("Active", expiryDate)
                .stream()
                .map(member -> {
                    Map<String, Object> notification = new HashMap<>();
                    notification.put("memberId", member.getId());
                    notification.put("name", member.getName());
                    notification.put("membershipPlan", member.getMembershipPlan());
                    notification.put("expiryDate", member.getExpiryDate());
                    return notification;
                })
                .toList();
    }
}
